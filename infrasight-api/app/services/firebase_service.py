from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.services.mock_data import SEED_DATA

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    firebase_admin = None
    credentials = None
    firestore = None


class DataStore:
    def __init__(self):
        self.mode = "mock"
        self.db = None
        self.error = None
        self.collections = list(SEED_DATA.keys())
        self._mock_data = deepcopy(SEED_DATA)
        self._initialize_firebase()
        if self.mode == "mock":
            self.seed_collections()
        self.seed_admin_user()

    def _initialize_firebase(self):
        if settings.MOCK_MODE:
            self.error = "MOCK_MODE is enabled"
            return
        if firebase_admin is None:
            self.error = "firebase-admin is not installed"
            return

        try:
            credential_source = self._credential_source()
            if credential_source is None:
                self.error = "Set FIREBASE_SERVICE_ACCOUNT_PATH, GOOGLE_APPLICATION_CREDENTIALS, or local Firebase service account env fields"
                return

            if not firebase_admin._apps:
                cred = credentials.Certificate(credential_source)
                firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
            self.db = firestore.client()
            self.mode = "firestore"
            self.error = None
        except Exception as exc:
            self.db = None
            self.mode = "mock"
            self.error = f"Firebase initialization failed: {exc}"

    def _credential_source(self):
        credential_path = settings.firebase_credentials_path
        if credential_path:
            path = Path(credential_path)
            if path.exists():
                return str(path)
            self.error = f"Firebase service account file not found: {path}"
            return None

        if settings.FIREBASE_PRIVATE_KEY and settings.FIREBASE_CLIENT_EMAIL:
            return {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
                "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "client_id": settings.FIREBASE_CLIENT_ID,
                "auth_uri": settings.FIREBASE_AUTH_URI,
                "token_uri": settings.FIREBASE_TOKEN_URI,
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{settings.FIREBASE_CLIENT_EMAIL.replace('@', '%40')}",
                "universe_domain": "googleapis.com",
            }
        return None

    def seed_collections(self):
        if self.mode == "firestore" and self.db is not None:
            for collection_name, records in SEED_DATA.items():
                for record in records:
                    self.db.collection(collection_name).document(record["id"]).set(record, merge=True)
        else:
            self._mock_data = deepcopy(SEED_DATA)

    def seed_admin_user(self):
        admin_uid = settings.ADMIN_USER_UID
        if not admin_uid:
            return
        admin_user = {
            "id": admin_uid,
            "uid": admin_uid,
            "fullName": "GZU Admin",
            "email": "admin@gzu.ac.zw",
            "role": "admin",
            "department": "ICT",
            "isActive": True,
            "updated_at": timestamp_now(),
        }
        existing = self.get_document("users", admin_uid)
        if existing:
            self.update_document("users", admin_uid, admin_user)
        else:
            self.create_document("users", admin_uid, admin_user)

    def list_documents(self, collection_name: str) -> List[Dict[str, Any]]:
        if self.mode == "firestore" and self.db is not None:
            return [self._with_id(doc.id, doc.to_dict()) for doc in self.db.collection(collection_name).stream()]
        return deepcopy(self._mock_data.get(collection_name, []))

    def get_document(self, collection_name: str, document_id: str) -> Optional[Dict[str, Any]]:
        if self.mode == "firestore" and self.db is not None:
            doc = self.db.collection(collection_name).document(document_id).get()
            if doc.exists:
                return self._with_id(doc.id, doc.to_dict())
            return None

        for record in self._mock_data.get(collection_name, []):
            if record.get("id") == document_id:
                return deepcopy(record)
        return None

    def create_document(self, collection_name: str, document_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        record = {"id": document_id, **data}
        if self.mode == "firestore" and self.db is not None:
            self.db.collection(collection_name).document(document_id).set(record)
            return record

        self._mock_data.setdefault(collection_name, []).append(deepcopy(record))
        return record

    def update_document(self, collection_name: str, document_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        existing = self.get_document(collection_name, document_id)
        if existing is None:
            return None

        updated = {**existing, **data}
        if self.mode == "firestore" and self.db is not None:
            self.db.collection(collection_name).document(document_id).set(updated, merge=True)
            return updated

        records = self._mock_data.setdefault(collection_name, [])
        for index, record in enumerate(records):
            if record.get("id") == document_id:
                records[index] = deepcopy(updated)
                break
        return updated

    def delete_document(self, collection_name: str, document_id: str) -> bool:
        if self.mode == "firestore" and self.db is not None:
            if self.get_document(collection_name, document_id) is None:
                return False
            self.db.collection(collection_name).document(document_id).delete()
            return True

        records = self._mock_data.setdefault(collection_name, [])
        for record in records:
            if record.get("id") == document_id:
                records.remove(record)
                return True
        return False

    def filter_documents(self, collection_name: str, field_name: str, value: Any) -> List[Dict[str, Any]]:
        return [record for record in self.list_documents(collection_name) if record.get(field_name) == value]

    def next_id(self, collection_name: str, prefix: str) -> str:
        count = len(self.list_documents(collection_name)) + 1
        return f"{prefix}-{count:03d}"

    def _with_id(self, document_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        record = dict(data or {})
        record.setdefault("id", document_id)
        return record


def timestamp_now() -> datetime:
    return datetime.now()


datastore = DataStore()
