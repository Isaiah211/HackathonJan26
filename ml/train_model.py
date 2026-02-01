from __future__ import annotations

import argparse

from ml.model_trainer import ModelTrainer


def main() -> None:
    parser = argparse.ArgumentParser(description="Train business impact RandomForest model")
    parser.add_argument("--output", type=str, default=None, help="Optional output directory")
    args = parser.parse_args()

    trainer = ModelTrainer(output_dir=args.output)
    artifacts = trainer.run()
    print("Model saved to", artifacts.model_path)
    print("Feature columns saved to", artifacts.feature_columns_path)
    print("Metadata saved to", artifacts.metadata_path)
    print("Training dataset exported to", artifacts.dataset_export_path)


if __name__ == "__main__":
    main()
