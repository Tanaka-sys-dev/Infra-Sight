import os
from pathlib import Path

import numpy as np

from app.ml.dataset_builder import FEATURE_COLUMNS, DatasetBuilder
from app.ml.trainer import ModelTrainer

if os.getenv("VERCEL"):
    MODEL_DIR = Path("/tmp/infrasight-models")
else:
    MODEL_DIR = Path(__file__).parent / "models"

MODEL_PATH = MODEL_DIR / "rf_model.joblib"
METRICS_PATH = MODEL_DIR / "rf_model.metrics.json"
FEATURES_PATH = MODEL_DIR / "rf_model.features.json"
DATASET_PATH = MODEL_DIR / "training_dataset.csv"


class ModelManager:
    def __init__(self):
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        self.trainer = None
        self.is_loaded = False

    def train_and_save(self, n_samples=500, use_firestore=False, datastore=None):
        dataset_builder = DatasetBuilder()
        df = None
        if use_firestore and datastore is not None:
            df = dataset_builder.build_from_firestore(datastore)
        if df is None:
            df = dataset_builder.build_from_simulator(n_samples=n_samples)
        dataset_builder.save_dataset(df, DATASET_PATH)
        X, y = dataset_builder.prepare_features(df)
        self.trainer = ModelTrainer(n_estimators=200)
        self.trainer.train(X, y)
        self.trainer.save_model(MODEL_PATH)
        self.is_loaded = True
        return self.trainer.metrics

    def load_model(self):
        if MODEL_PATH.exists():
            self.trainer = ModelTrainer()
            self.trainer.load_model(MODEL_PATH)
            self.is_loaded = True
            return True
        return False

    def predict(self, features_dict):
        if not self.is_loaded or self.trainer is None or self.trainer.model is None:
            raise RuntimeError("Model is not loaded")
        values = [float(features_dict[column]) for column in FEATURE_COLUMNS]
        X = np.array(values, dtype=float).reshape(1, 8)
        prediction = int(self.trainer.model.predict(X)[0])
        probabilities = self.trainer.model.predict_proba(X)[0]
        normal_probability = float(probabilities[0])
        fault_probability = float(probabilities[1]) if len(probabilities) > 1 else 0.0
        confidence = fault_probability if prediction == 1 else normal_probability
        return {
            "predictedClass": "fault_prone" if prediction == 1 else "normal",
            "confidence": round(confidence, 4),
            "allProbabilities": {
                "normal": round(normal_probability, 4),
                "fault_prone": round(fault_probability, 4),
            },
        }

    def predict_batch(self, features_list):
        return [self.predict(features) for features in features_list]

    def get_model_info(self):
        if self.is_loaded and self.trainer is not None:
            return self.trainer.get_model_info()
        return {"is_trained": False}