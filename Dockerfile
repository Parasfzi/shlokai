# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=7860

# Set the working directory
WORKDIR /app

# Copy the requirements file
COPY backend/requirements.txt /app/

# Install the dependencies
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend files
COPY backend /app/backend

# Copy the dataset (JSON only - we rebuild index inside Docker)
COPY final/final_gita.json /app/final/final_gita.json
COPY final/build_index.py /app/final/build_index.py

# Build the FAISS index inside Docker (avoids binary file issues with Git)
RUN cd /app/final && python build_index.py

# Expose the correct port for Hugging Face Spaces (always 7860)
EXPOSE 7860

# Command to run the application
CMD ["python", "backend/run_deploy.py"]
