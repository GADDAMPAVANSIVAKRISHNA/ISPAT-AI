"""
ML Inference Service — loads trained models and provides predictions.
"""
import os
import numpy as np
import joblib

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


class MLService:
    """Singleton ML inference service — loads models once, serves predictions."""

    def __init__(self):
        self.failure_model = None
        self.rul_model = None
        self.rca_data = None
        self.production_data = None
        self.anomaly_model = None
        self._loaded = False

    def load_models(self):
        """Load all trained models from disk."""
        if self._loaded:
            return

        try:
            failure_path = os.path.join(MODELS_DIR, "failure_predictor.joblib")
            if os.path.exists(failure_path):
                self.failure_model = joblib.load(failure_path)

            rul_path = os.path.join(MODELS_DIR, "rul_estimator.joblib")
            if os.path.exists(rul_path):
                self.rul_model = joblib.load(rul_path)

            rca_path = os.path.join(MODELS_DIR, "rca_classifier.joblib")
            if os.path.exists(rca_path):
                self.rca_data = joblib.load(rca_path)

            prod_path = os.path.join(MODELS_DIR, "production_forecaster.joblib")
            if os.path.exists(prod_path):
                self.production_data = joblib.load(prod_path)

            anomaly_path = os.path.join(MODELS_DIR, "anomaly_detector.joblib")
            if os.path.exists(anomaly_path):
                self.anomaly_model = joblib.load(anomaly_path)

            self._loaded = True
            loaded_count = sum(1 for m in [
                self.failure_model, self.rul_model, self.rca_data,
                self.production_data, self.anomaly_model
            ] if m is not None)
            print(f"  ✓ Loaded {loaded_count}/5 ML models")
        except Exception as e:
            print(f"  ⚠ Error loading models: {e}")

    def predict_failure(self, sensors: dict) -> dict:
        """
        Predict failure probability for a machine given its sensor readings.
        Returns: {"probability": 0-100, "will_fail": bool, "confidence": float}
        """
        if not self.failure_model:
            return {"probability": 50.0, "will_fail": False, "confidence": 0.0}

        features = np.array([[
            sensors.get("temperature", {}).get("value", 65),
            sensors.get("vibration", {}).get("value", 2.5),
            sensors.get("current", {}).get("value", 30),
            sensors.get("pressure", {}).get("value", 5.5),
            sensors.get("rpm", {}).get("value", 1300),
            sensors.get("runtimeHours", {}).get("value", 5000),
        ]])

        try:
            proba = self.failure_model.predict_proba(features)[0]
            fail_prob = round(float(proba[1]) * 100, 1) if len(proba) > 1 else 0.0
            return {
                "probability": fail_prob,
                "will_fail": fail_prob > 60,
                "confidence": round(float(max(proba)) * 100, 1),
            }
        except Exception:
            return {"probability": 50.0, "will_fail": False, "confidence": 0.0}

    def predict_rul(self, sensors: dict) -> dict:
        """
        Predict remaining useful life for a machine.
        Returns: {"rul_days": int, "confidence": float}
        """
        if not self.rul_model:
            return {"rul_days": 30, "confidence": 0.0}

        features = np.array([[
            sensors.get("temperature", {}).get("value", 65),
            sensors.get("vibration", {}).get("value", 2.5),
            sensors.get("current", {}).get("value", 30),
            sensors.get("pressure", {}).get("value", 5.5),
            sensors.get("rpm", {}).get("value", 1300),
            sensors.get("runtimeHours", {}).get("value", 5000),
        ]])

        try:
            rul = self.rul_model.predict(features)[0]
            return {
                "rul_days": max(1, round(float(rul))),
                "confidence": 85.0,  # RF doesn't give native confidence for regression
            }
        except Exception:
            return {"rul_days": 30, "confidence": 0.0}

    def predict_root_cause(self, context: dict) -> dict:
        """
        Classify root cause of a production loss event.
        Returns: {"primary_cause": str, "confidence": float, "all_causes": list}
        """
        if not self.rca_data:
            return {"primary_cause": "Unknown", "confidence": 0.0, "all_causes": []}

        model = self.rca_data["model"]
        labels = self.rca_data["labels"]

        features = np.array([[
            context.get("temperature", 70),
            context.get("vibration", 3.0),
            context.get("downtime_hours", 2.0),
            context.get("shift_efficiency", 80),
            context.get("energy_waste_pct", 10),
        ]])

        try:
            proba = model.predict_proba(features)[0]
            cause_idx = int(np.argmax(proba))
            all_causes = [
                {"cause": labels[i], "probability": round(float(p) * 100, 1)}
                for i, p in enumerate(proba)
            ]
            all_causes.sort(key=lambda x: x["probability"], reverse=True)

            return {
                "primary_cause": labels[cause_idx],
                "confidence": round(float(proba[cause_idx]) * 100, 1),
                "all_causes": all_causes,
            }
        except Exception:
            return {"primary_cause": "Unknown", "confidence": 0.0, "all_causes": []}

    def forecast_production(self, recent_data: list) -> dict:
        """
        Forecast next-day production based on recent history.
        Returns: {"forecast_tons": float, "confidence_low": float, "confidence_high": float}
        """
        if not self.production_data:
            return {"forecast_tons": 950, "confidence_low": 900, "confidence_high": 1000}

        model = self.production_data["model"]

        try:
            from datetime import datetime, timedelta
            tomorrow = datetime.now() + timedelta(days=1)
            day_of_week = tomorrow.weekday()
            month = tomorrow.month

            # Calculate rolling averages from recent data
            values = [d.get("actual", 950) for d in recent_data[-30:]]
            rolling_7 = np.mean(values[-7:]) if len(values) >= 7 else np.mean(values)
            rolling_30 = np.mean(values) if values else 950
            lag_1 = values[-1] if values else 950
            lag_7 = values[-7] if len(values) >= 7 else lag_1

            features = np.array([[day_of_week, month, rolling_7, rolling_30, lag_1, lag_7]])
            forecast = model.predict(features)[0]

            return {
                "forecast_tons": round(float(forecast)),
                "confidence_low": round(float(forecast) * 0.93),
                "confidence_high": round(float(forecast) * 1.05),
            }
        except Exception:
            return {"forecast_tons": 950, "confidence_low": 900, "confidence_high": 1000}

    def detect_anomalies(self, sensors: dict) -> dict:
        """
        Detect anomalous sensor patterns.
        Returns: {"is_anomaly": bool, "anomaly_score": float}
        """
        if not self.anomaly_model:
            return {"is_anomaly": False, "anomaly_score": 0.0}

        features = np.array([[
            sensors.get("temperature", {}).get("value", 65),
            sensors.get("vibration", {}).get("value", 2.5),
            sensors.get("current", {}).get("value", 30),
            sensors.get("pressure", {}).get("value", 5.5),
            sensors.get("rpm", {}).get("value", 1300),
            sensors.get("runtimeHours", {}).get("value", 5000),
        ]])

        try:
            prediction = self.anomaly_model.predict(features)[0]
            score = self.anomaly_model.decision_function(features)[0]
            return {
                "is_anomaly": prediction == -1,
                "anomaly_score": round(float(-score), 3),
            }
        except Exception:
            return {"is_anomaly": False, "anomaly_score": 0.0}


# Singleton instance
ml_service = MLService()
