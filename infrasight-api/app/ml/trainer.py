import json
from pathlib import Path

import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

from app.ml.dataset_builder import FEATURE_COLUMNS


class ModelTrainer:
    def __init__(self, n_estimators=200, random_state=42, test_size=0.3):
        self.n_estimators = n_estimators
        self.random_state = random_state
        self.test_size = test_size
        self.model = None
        self.metrics = {}
        self.feature_importance = []

    def train(self, X, y):
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=self.test_size,
            random_state=self.random_state,
            stratify=y,
        )
        self.model = RandomForestClassifier(
            n_estimators=self.n_estimators,
            random_state=self.random_state,
            max_depth=None,
            min_samples_split=2,
            min_samples_leaf=1,
            class_weight="balanced",
        )
        self.model.fit(X_train, y_train)
        predictions = self.model.predict(X_test)
        self.metrics = {
            "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
            "precision": round(float(precision_score(y_test, predictions, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, predictions, zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_test, predictions, zero_division=0)), 4),
            "confusion_matrix": confusion_matrix(y_test, predictions).tolist(),
            "n_train_samples": int(len(y_train)),
            "n_test_samples": int(len(y_test)),
            "n_features": int(X.shape[1]),
            "n_estimators": int(self.n_estimators),
        }
        self.feature_importance = sorted(
            [
                {"feature": feature, "importance": round(float(importance), 4)}
                for feature, importance in zip(FEATURE_COLUMNS, self.model.feature_importances_)
            ],
            key=lambda item: item["importance"],
            reverse=True,
        )
        return self

    def evaluate(self, X_test, y_test):
        predictions = self.model.predict(X_test)
        return {
            "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
            "precision": round(float(precision_score(y_test, predictions, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, predictions, zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_test, predictions, zero_division=0)), 4),
        }

    def save_model(self, path):
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, target)
        target.with_suffix(".metrics.json").write_text(json.dumps(self.metrics, indent=2), encoding="utf-8")
        target.with_suffix(".features.json").write_text(json.dumps(self.feature_importance, indent=2), encoding="utf-8")
        return target

    def load_model(self, path):
        target = Path(path)
        self.model = joblib.load(target)
        metrics_path = target.with_suffix(".metrics.json")
        features_path = target.with_suffix(".features.json")
        if metrics_path.exists():
            self.metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
        if features_path.exists():
            self.feature_importance = json.loads(features_path.read_text(encoding="utf-8"))
        return self

    def get_model_info(self):
        return {
            "model_version": "rf-v1",
            "n_estimators": self.n_estimators,
            "metrics": self.metrics,
            "feature_importance": self.feature_importance,
            "is_trained": self.model is not None,
        }
