import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

# Sample training dataset (Regional mandi baselines & demand factors)
data = pd.DataFrame({
    'crop': ['Wheat', 'Wheat', 'Rice', 'Rice', 'Tomato', 'Tomato'],
    'mandi_baseline': [2400, 2450, 3100, 3150, 1800, 1900],
    'demand_index': [85, 90, 70, 75, 95, 92],
    'recommended_price': [2480, 2520, 3180, 3220, 1950, 2010]
})

X = data[['crop', 'mandi_baseline', 'demand_index']]
y = data['recommended_price']

preprocessor = ColumnTransformer(
    transformers=[('cat', OneHotEncoder(handle_unknown='ignore'), ['crop'])],
    remainder='passthrough'
)

model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(n_estimators=10, random_state=42))
])

model.fit(X, y)
joblib.dump(model, 'price_model.pkl')
print("✅ Trained machine learning model saved as 'price_model.pkl'")