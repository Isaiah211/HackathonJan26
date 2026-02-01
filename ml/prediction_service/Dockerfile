FROM python:3.11-slim

WORKDIR /app

# Install dependencies from the prediction_service requirements file
COPY ml/requirements.txt /requirements.txt
COPY ml/prediction_service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy only the ml package (keeps image small and paths consistent)
COPY ml /app/ml

EXPOSE 9000

CMD ["python", "-m", "ml.prediction_service.app"]
