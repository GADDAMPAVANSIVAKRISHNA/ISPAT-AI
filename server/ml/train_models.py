"""
ISPAT AI — ML Model Training Pipeline

Generates synthetic training data based on steel manufacturing domain knowledge,
trains 5 ML models, and saves them as .joblib files for inference.

Models:
1. XGBoost Failure Predictor — predicts machine failure probability
2. Random Forest RUL Estimator — predicts remaining useful life in days
3. Random Forest Root Cause Classifier — classifies production loss causes
4. Production Forecaster — predicts next-day production tonnage
5. Isolation Forest Anomaly Detector — detects abnormal sensor patterns
"""
import os
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error, f1_score
import joblib

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("⚠ XGBoost not available, using RandomForest as fallback for failure prediction")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def generate_failure_dataset(n_samples=10000):
    """
    Generate synthetic sensor data for failure prediction.
    Based on real bearing/motor degradation patterns:
    - As bearing wears: vibration↑, temperature↑, current↑
    - As pressure drops: performance↓
    - Runtime hours correlate with wear
    """
    np.random.seed(42)

    # Normal operating conditions (60% of data)
    n_normal = int(n_samples * 0.6)
    # Warning conditions (25%)
    n_warning = int(n_samples * 0.25)
    # Critical/failure conditions (15%)
    n_critical = n_samples - n_normal - n_warning

    data = []

    # Normal samples
    for _ in range(n_normal):
        temp = np.random.normal(65, 8)
        vibration = np.random.normal(2.5, 0.8)
        current = np.random.normal(30, 3)
        pressure = np.random.normal(5.5, 0.8)
        rpm = np.random.normal(1300, 80)
        runtime = np.random.uniform(1000, 10000)
        data.append([temp, vibration, current, pressure, rpm, runtime, 0])

    # Warning samples
    for _ in range(n_warning):
        temp = np.random.normal(78, 5)
        vibration = np.random.normal(5.5, 1.0)
        current = np.random.normal(37, 2)
        pressure = np.random.normal(6.8, 0.5)
        rpm = np.random.normal(1100, 100)
        runtime = np.random.uniform(8000, 13000)
        data.append([temp, vibration, current, pressure, rpm, runtime, 0])

    # Critical/failure samples
    for _ in range(n_critical):
        temp = np.random.normal(92, 6)
        vibration = np.random.normal(8.0, 1.5)
        current = np.random.normal(42, 3)
        pressure = np.random.normal(7.5, 0.4)
        rpm = np.random.normal(900, 120)
        runtime = np.random.uniform(12000, 16000)
        data.append([temp, vibration, current, pressure, rpm, runtime, 1])

    df = pd.DataFrame(data, columns=[
        "temperature", "vibration", "current", "pressure", "rpm", "runtime_hours", "will_fail"
    ])
    return df.sample(frac=1, random_state=42).reset_index(drop=True)


def generate_rul_dataset(n_samples=5000):
    """
    Generate synthetic data for Remaining Useful Life prediction.
    Maps sensor conditions to days-until-failure.
    """
    np.random.seed(43)
    data = []

    for _ in range(n_samples):
        # RUL follows degradation curve
        rul = np.random.uniform(1, 120)

        # Sensors degrade as RUL decreases
        degradation = max(0, 1 - (rul / 120))

        temp = 55 + 40 * degradation + np.random.normal(0, 3)
        vibration = 1.5 + 7.0 * degradation + np.random.normal(0, 0.5)
        current = 25 + 18 * degradation + np.random.normal(0, 1.5)
        pressure = 4.0 + 4.0 * degradation + np.random.normal(0, 0.3)
        rpm = 1500 - 600 * degradation + np.random.normal(0, 30)
        runtime = 15000 * degradation + np.random.uniform(1000, 5000)

        data.append([temp, vibration, current, pressure, rpm, runtime, round(rul)])

    df = pd.DataFrame(data, columns=[
        "temperature", "vibration", "current", "pressure", "rpm", "runtime_hours", "rul_days"
    ])
    return df


def generate_rca_dataset(n_samples=3000):
    """
    Generate synthetic data for root cause classification.
    Maps sensor patterns + context to loss cause categories.
    """
    np.random.seed(44)

    causes = [
        "Equipment Failure", "Shift Delay", "Material Shortage",
        "Energy Issue", "Maintenance Stop"
    ]
    data = []

    for _ in range(n_samples):
        cause_idx = np.random.choice(len(causes))
        cause = causes[cause_idx]

        # Each cause has characteristic sensor signatures
        if cause == "Equipment Failure":
            temp = np.random.normal(88, 8)
            vibration = np.random.normal(7.5, 1.5)
            downtime = np.random.uniform(2, 8)
            shift_eff = np.random.normal(75, 10)
            energy_waste = np.random.normal(12, 3)
        elif cause == "Shift Delay":
            temp = np.random.normal(70, 5)
            vibration = np.random.normal(3.0, 0.8)
            downtime = np.random.uniform(0.5, 3)
            shift_eff = np.random.normal(65, 12)
            energy_waste = np.random.normal(8, 2)
        elif cause == "Material Shortage":
            temp = np.random.normal(65, 5)
            vibration = np.random.normal(2.5, 0.5)
            downtime = np.random.uniform(1, 4)
            shift_eff = np.random.normal(72, 8)
            energy_waste = np.random.normal(6, 2)
        elif cause == "Energy Issue":
            temp = np.random.normal(75, 6)
            vibration = np.random.normal(4.0, 1.0)
            downtime = np.random.uniform(0.5, 2)
            shift_eff = np.random.normal(78, 8)
            energy_waste = np.random.normal(18, 4)
        else:  # Maintenance Stop
            temp = np.random.normal(60, 4)
            vibration = np.random.normal(2.0, 0.5)
            downtime = np.random.uniform(1, 6)
            shift_eff = np.random.normal(80, 5)
            energy_waste = np.random.normal(5, 1.5)

        data.append([temp, vibration, downtime, shift_eff, energy_waste, cause_idx])

    df = pd.DataFrame(data, columns=[
        "temperature", "vibration", "downtime_hours", "shift_efficiency", "energy_waste_pct", "cause"
    ])
    return df, causes


def generate_production_dataset(n_days=365):
    """Generate 1 year of daily production data for forecasting."""
    np.random.seed(45)
    dates = pd.date_range(end=pd.Timestamp.now(), periods=n_days, freq="D")
    data = []

    base_production = 950
    for i, date in enumerate(dates):
        # Weekly seasonality (lower on weekends)
        day_of_week = date.dayofweek
        weekly_factor = 1.0 if day_of_week < 5 else 0.85

        # Monthly trend (slight growth)
        trend = i * 0.1

        # Random variation
        noise = np.random.normal(0, 40)

        # Occasional major dips (shutdowns, breakdowns)
        if np.random.random() < 0.05:
            noise -= np.random.uniform(100, 250)

        actual = max(400, base_production * weekly_factor + trend + noise)
        target = 1000
        loss = max(0, target - actual)

        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "day_of_week": day_of_week,
            "month": date.month,
            "target": target,
            "actual": round(actual),
            "loss": round(loss),
            "efficiency": round(actual / target * 100, 1),
        })

    return pd.DataFrame(data)


def train_failure_predictor():
    """Train XGBoost failure probability model."""
    print("  Training Failure Predictor (XGBoost)...")
    df = generate_failure_dataset()
    X = df.drop("will_fail", axis=1)
    y = df["will_fail"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    if HAS_XGBOOST:
        model = XGBClassifier(
            n_estimators=200, max_depth=6, learning_rate=0.1,
            random_state=42, eval_metric="logloss",
            use_label_encoder=False
        )
    else:
        model = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    print(f"    Accuracy: {acc:.4f}, F1: {f1:.4f}")

    path = os.path.join(MODELS_DIR, "failure_predictor.joblib")
    joblib.dump(model, path)
    print(f"    Saved to {path}")
    return model


def train_rul_estimator():
    """Train Random Forest RUL estimator."""
    print("  Training RUL Estimator (Random Forest)...")
    df = generate_rul_dataset()
    X = df.drop("rul_days", axis=1)
    y = df["rul_days"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=200, max_depth=12, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"    MAE: {mae:.2f} days")

    path = os.path.join(MODELS_DIR, "rul_estimator.joblib")
    joblib.dump(model, path)
    print(f"    Saved to {path}")
    return model


def train_rca_classifier():
    """Train Random Forest root cause classifier."""
    print("  Training Root Cause Classifier (Random Forest)...")
    df, cause_labels = generate_rca_dataset()
    X = df.drop("cause", axis=1)
    y = df["cause"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"    Accuracy: {acc:.4f}")

    # Save model and labels
    path = os.path.join(MODELS_DIR, "rca_classifier.joblib")
    joblib.dump({"model": model, "labels": cause_labels}, path)
    print(f"    Saved to {path}")
    return model


def train_production_forecaster():
    """Train production forecaster using linear regression-style RF."""
    print("  Training Production Forecaster (Random Forest)...")
    df = generate_production_dataset()

    # Features: day_of_week, month, rolling averages
    df["rolling_7"] = df["actual"].rolling(7, min_periods=1).mean()
    df["rolling_30"] = df["actual"].rolling(30, min_periods=1).mean()
    df["lag_1"] = df["actual"].shift(1).fillna(df["actual"].mean())
    df["lag_7"] = df["actual"].shift(7).fillna(df["actual"].mean())

    features = ["day_of_week", "month", "rolling_7", "rolling_30", "lag_1", "lag_7"]
    X = df[features]
    y = df["actual"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    model = RandomForestRegressor(n_estimators=150, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"    MAE: {mae:.1f} tons")

    path = os.path.join(MODELS_DIR, "production_forecaster.joblib")
    joblib.dump({"model": model, "features": features}, path)
    print(f"    Saved to {path}")
    return model


def train_anomaly_detector():
    """Train Isolation Forest for sensor anomaly detection."""
    print("  Training Anomaly Detector (Isolation Forest)...")
    df = generate_failure_dataset()

    # Train only on normal data
    normal_data = df[df["will_fail"] == 0].drop("will_fail", axis=1)

    model = IsolationForest(
        n_estimators=200, contamination=0.05,
        random_state=42, max_samples="auto"
    )
    model.fit(normal_data)

    # Test on all data
    predictions = model.predict(df.drop("will_fail", axis=1))
    n_anomalies = (predictions == -1).sum()
    print(f"    Detected {n_anomalies}/{len(df)} anomalies ({n_anomalies/len(df)*100:.1f}%)")

    path = os.path.join(MODELS_DIR, "anomaly_detector.joblib")
    joblib.dump(model, path)
    print(f"    Saved to {path}")
    return model


def train_all():
    """Train all ML models."""
    print("\n[ML] Training ISPAT AI ML Models...\n")

    train_failure_predictor()
    print()
    train_rul_estimator()
    print()
    train_rca_classifier()
    print()
    train_production_forecaster()
    print()
    train_anomaly_detector()

    print("\n✅ All models trained and saved!\n")


if __name__ == "__main__":
    train_all()
