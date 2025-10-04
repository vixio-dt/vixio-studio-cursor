import json
from pathlib import Path
from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import JSONResponse
from jsonschema import validate, ValidationError


app = FastAPI(title="Vixio Narrative Service", version="0.1.0")


SCHEMA_PATH = Path(__file__).parent / "schemas" / "narrative.schema.json"

@app.get("/")
async def root() -> dict:
    return {"service": "narrative", "status": "ok", "endpoints": ["/health", "/schema", "/validate"]}


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/schema")
async def get_schema() -> JSONResponse:
    try:
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Schema not found")
    return JSONResponse(schema)


@app.post("/validate")
async def validate_document(document: dict = Body(...)) -> dict:
    try:
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        validate(instance=document, schema=schema)
        return {"valid": True}
    except ValidationError as e:
        raise HTTPException(status_code=400, detail={
            "message": "Validation failed",
            "error": e.message,
            "path": list(e.path),
            "schema_path": list(e.schema_path),
        })


