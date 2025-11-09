# auraxlsl_runtime.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Union, Dict, Optional
from lark import Lark, Transformer, v_args
import uvicorn
import json
import os

# Optional Elasticsearch
try:
    from elasticsearch import Elasticsearch
    ES_ENABLED = True
    ES = Elasticsearch("http://localhost:9200")
except ImportError:
    ES_ENABLED = False

# -------------------
# ABNF grammar (simplified)
# -------------------
auraxlsl_grammar = r"""
?start: message

message: "{" "message" declarations pattern "}"

declarations: (input_decl | local_decl)*

input_decl: ".input" "$" CNAME "=" expr
local_decl: ".local" "$" CNAME "=" expr

pattern: (STRING | expr | markup)*

?expr: literal_expr
     | variable_expr
     | function_expr

literal_expr: "{" literal (":" CNAME (option)*)? "}"
variable_expr: "{" "$" CNAME (":" CNAME (option)*)? "}"
function_expr: "{" ":" CNAME (option)* "}"

markup: "{" "#" CNAME (option)* "}"
      | "{" "/" CNAME (option)* "}"

option: CNAME "=" (STRING | "$" CNAME)

literal: STRING

%import common.CNAME
%import common.ESCAPED_STRING -> STRING
%import common.WS
%ignore WS
"""

# -------------------
# Lark Transformer
# -------------------
class ASTNode:
    pass

@v_args(inline=True)
class AuraxTransformer(Transformer):
    def message(self, *args):
        decls = []
        pattern = []
        for a in args:
            if isinstance(a, list):
                decls.extend(a)
            else:
                pattern.append(a)
        return {"type": "message", "declarations": decls, "pattern": pattern}

    def input_decl(self, name, value):
        return {"type": "input", "name": str(name), "value": value}

    def local_decl(self, name, value):
        return {"type": "local", "name": str(name), "value": value}

    def literal_expr(self, value, *func):
        return {"type": "literal", "value": str(value)}

    def variable_expr(self, name, *func):
        return {"type": "variable", "name": str(name)}

    def function_expr(self, name, *options):
        opts = {o[0]: o[1] for o in options} if options else {}
        return {"type": "function", "name": str(name), "options": opts}

    def markup(self, *args):
        return {"type": "markup", "name": str(args[0])}

    def option(self, key, val):
        return (str(key), str(val))

# -------------------
# Evaluator
# -------------------
class AuraxEvaluator:
    def __init__(self, ast):
        self.ast = ast
        self.context = {}

    def load_declarations(self):
        for decl in self.ast["declarations"]:
            if decl["type"] == "input":
                self.context[decl["name"]] = decl["value"]["value"]
            elif decl["type"] == "local":
                self.context[decl["name"]] = self.eval_expr(decl["value"])

    def eval_expr(self, expr):
        if expr["type"] == "literal":
            return expr["value"]
        elif expr["type"] == "variable":
            return self.context.get(expr["name"], "")
        elif expr["type"] == "function":
            return self.call_function(expr["name"], expr.get("options", {}))
        return ""

    def call_function(self, name, options):
        # Example functions
        if name == "uppercase":
            arg = options.get("arg", "")
            return str(arg).upper()
        elif name == "repeat":
            arg = str(options.get("arg", ""))
            n = int(options.get("n", 1))
            return arg * n
        return f"<unknown-function:{name}>"

    def render_pattern(self):
        result = ""
        for p in self.ast["pattern"]:
            if isinstance(p, dict):
                if p["type"] in ["literal", "variable", "function"]:
                    result += self.eval_expr(p)
                elif p["type"] == "markup":
                    result += f"<{p['name']}>"
            else:
                result += str(p)
        return result

    def run(self):
        self.load_declarations()
        return self.render_pattern()

# -------------------
# FastAPI app
# -------------------
app = FastAPI()
parser = Lark(auraxlsl_grammar, parser="lalr", transformer=AuraxTransformer())

class RunPayload(BaseModel):
    message: str  # Full AuraxLSL message as string

@app.post("/run")
def run(payload: RunPayload):
    try:
        ast = parser.parse(payload.message)
        evaluator = AuraxEvaluator(ast)
        result = evaluator.run()

        # Optional Elasticsearch storage
        if ES_ENABLED:
            ES.index(index="auraxlsl", document={"input": payload.message, "result": result})

        return {"result": result, "ast": ast}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# -------------------
# CLI support
# -------------------
if __name__ == "__main__":
    uvicorn.run("auraxlsl_runtime:app", host="0.0.0.0", port=8000, reload=True)
