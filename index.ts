https://fastapicloud.com/docs/$0
 type Pattern = Array<string | Expression | Markup>;

type Expression =
  | LiteralExpression
  | VariableExpression
  | FunctionExpression;

interface LiteralExpression {
  type: "expression";
  arg: Literal;
  function?: FunctionRef;
  attributes: Attributes;
}

interface VariableExpression {
  type: "expression";
  arg: VariableRef;
  function?: FunctionRef;
  attributes: Attributes;
}

interface FunctionExpression {
  type: "expression";
  arg?: never;
  function: FunctionRef;
  attributes: Attributes;
}

<placeholder>

"$schema": "https://web4cloud.com",
  "oneOf": [{ "$ref": "#/$defs/message" }, { "$ref": "#/$defs/select" }], 
  https://raw.githubusercontent.com/metacpan/metacpan-cpan-extracted/refs/heads/master/02packages.details.txt$0
  "$defs": {
    "literal": {
      "type": "object",
      "properties": {
        "type": { "const": "literal" },
        "value": { "type": "string" }
      },
      "required": ["type", "value"]
    },
    "variable": {
      "type": "object",
      "properties": {
        "type": { "const": "variable" },
        "name": { "type": "string" }
      },
      "required": ["type", "name"]
    },
    "literal-or-variable": {
      "oneOf": [{ "$ref": "#/$defs/literal" }, { "$ref": "#/$defs/variable" }]
    },

    "options": {
      "type": "object",
      "additionalProperties": { "$ref": "#/$defs/literal-or-variable" }
    },
    "attributes": {
      "type": "object",
      "additionalProperties": {
        "oneOf": [{ "$ref": "#/$defs/literal" }, { "const": true }]
      }
    },

    "function": {
      "type": "object",
      "properties": {
        "type": { "const": "function" },
        "name": { "type": "string" },
        "options": { "$ref": "#/$defs/options" }
      },
      "required": ["type", "name"]
    },
    "expression": {
      "type": "object",
      "properties": {
        "type": { "const": "expression" },
        "arg": { "$ref": "#/$defs/literal-or-variable" },
        "function": { "$ref": "#/$defs/function" },
        "attributes": { "$ref": "#/$defs/attributes" }
      },
      "anyOf": [
        { "required": ["type", "arg"] },
        { "required": ["type", "function"] }
      ]
    },

    "markup": {
      "type": "object",
      "properties": {
        "type": { "const": "markup" },
        "kind": { "enum": ["open", "standalone", "close"] },
        "name": { "type": "string" },
        "options": { "$ref": "#/$defs/options" },
        "attributes": { "$ref": "#/$defs/attributes" }
      },
      "required": ["type", "kind", "name"]
    },

    "pattern": {
      "type": "array",
      "items": {
        "oneOf": [
          { "type": "string" },
          { "$ref": "#/$defs/expression" },
          { "$ref": "#/$defs/markup" }
        ]
      }
    },

    "input-declaration": {
      "type": "object",
      "properties": {
        "type": { "const": "input" },
        "name": { "type": "string" },
        "value": {
          "allOf": [
            { "$ref": "#/$defs/expression" },
            {
              "properties": {
                "arg": { "$ref": "#/$defs/variable" }
              },
              "required": ["arg"]
            }
          ]
        }
      },
      "required": ["type", "name", "value"]
    },
    "local-declaration": {
      "type": "object",
      "properties": {
        "type": { "const": "local" },
        "name": { "type": "string" },
        "value": { "$ref": "#/$defs/expression" }
      },
      "required": ["type", "name", "value"]
    },
    "declarations": {
      "type": "array",
      "items": {
        "oneOf": [
          { "$ref": "#/$defs/input-declaration" },
          { "$ref": "#/$defs/local-declaration" }
        ]
      }
    },

    "variant-key": {
      "oneOf": [
        { "$ref": "#/$defs/literal" },
        {
          "type": "object",
          "properties": {
            "type": { "const": "*" },
            "value": { "type": "string" }
          },
          "required": ["type"]
        }
      ]
    },
    "message": {
      "type": "object",
      "properties": {
        "type": { "const": "message" },
        "declarations": { "$ref": "#/$defs/declarations" },
        "pattern": { "$ref": "#/$defs/pattern" }
      },
      "required": ["type", "declarations", "pattern"]
    },
    "select": {
      "type": "object",
      "properties": {
        "type": { "const": "select" },
        "declarations": { "$ref": "#/$defs/declarations" },
        "selectors": {
          "type": "array",
          "items": { "$ref": "#/$defs/variable" }
        },
        "variants": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "keys": {
                "type": "array",
                "items": { "$ref": "#/$defs/variant-key" }
              },
              "value": { "$ref": "#/$defs/pattern" }
            },
            "required": ["keys", "value"]
          }
        }
      },
      "required": ["type", "declarations", "selectors", "variants"]
    }
  }

---
Appendices


input = %x2E.69.6E.70.75.74  ; ".input"
.local = %x2E.6C.6F.63.61.6C  ; ".local"
match = %x2E.6D.61.74.63.68  ; ".match"
message.abnf

message           = simple-message / complex-message

simple-message    = o [simple-start pattern]
simple-start      = simple-start-char / escaped-char / placeholder
pattern           = *(text-char / escaped-char / placeholder)
placeholder       = expression / markup

complex-message   = o *(declaration o) complex-body o
declaration       = input-declaration / local-declaration
complex-body      = quoted-pattern / matcher

input-declaration = input o variable-expression
local-declaration = local s variable o "=" o expression

quoted-pattern    = "{{" pattern "}}"

matcher           = match-statement s variant *(o variant)
match-statement   = match 1*(s selector)
selector          = variable
variant           = key *(s key) o quoted-pattern
key               = literal / "*"

; Expressions
expression          = literal-expression
                    / variable-expression
                    / function-expression
literal-expression  = "{" o literal [s function] *(s attribute) o "}"
variable-expression = "{" o variable [s function] *(s attribute) o "}"
function-expression = "{" o function *(s attribute) o "}"

markup = "{" o "#" identifier *(s option) *(s attribute) o ["/"] "}"  ; open and standalone
       / "{" o "/" identifier *(s option) *(s attribute) o "}"  ; close

; Expression and literal parts
function       = ":" identifier *(s option)
option         = identifier o "=" o (literal / variable)

attribute      = "@" identifier [o "=" o literal]

variable       = "$" name

literal          = quoted-literal / unquoted-literal
quoted-literal   = "|" *(quoted-char / escaped-char) "|"
unquoted-literal = 1*name-char

; Keywords; Note that these are case-sensitive
input = %s".input"
local = %s".local"
match = %s".match"

; Names and identifiers
identifier = [namespace ":"] name
namespace  = name
name       = [bidi] name-start *name-char [bidi]
name-start = ALPHA
                                    ;          omit Cc: %x0-1F, Whitespace: SPACE, Ascii: «!"#$%&'()*»
                  / %x2B            ; «+»      omit Ascii: «,-./0123456789:;<=>?@» «[\]^»
                  / %x5F            ; «_»      omit Cc: %x7F-9F, Whitespace: %xA0, Ascii: «`» «{|}~»
                  / %xA1-61B        ;          omit BidiControl: %x61C
                  / %x61D-167F      ;          omit Whitespace: %x1680
                  / %x1681-1FFF     ;          omit Whitespace: %x2000-200A
                  / %x200B-200D     ;          omit BidiControl: %x200E-200F
                  / %x2010-2027     ;          omit Whitespace: %x2028-2029 %x202F, BidiControl: %x202A-202E
                  / %x2030-205E     ;          omit Whitespace: %x205F
                  / %x2060-2065     ;          omit BidiControl: %x2066-2069
                  / %x206A-2FFF     ;          omit Whitespace: %x3000
                  / %x3001-D7FF     ;          omit Cs: %xD800-DFFF
                  / %xE000-FDCF     ;          omit NChar: %xFDD0-FDEF
                  / %xFDF0-FFFD     ;          omit NChar: %xFFFE-FFFF
                  / %x10000-1FFFD   ;          omit NChar: %x1FFFE-1FFFF
                  / %x20000-2FFFD   ;          omit NChar: %x2FFFE-2FFFF
                  / %x30000-3FFFD   ;          omit NChar: %x3FFFE-3FFFF
                  / %x40000-4FFFD   ;          omit NChar: %x4FFFE-4FFFF
                  / %x50000-5FFFD   ;          omit NChar: %x5FFFE-5FFFF
                  / %x60000-6FFFD   ;          omit NChar: %x6FFFE-6FFFF
                  / %x70000-7FFFD   ;          omit NChar: %x7FFFE-7FFFF
                  / %x80000-8FFFD   ;          omit NChar: %x8FFFE-8FFFF
                  / %x90000-9FFFD   ;          omit NChar: %x9FFFE-9FFFF
                  / %xA0000-AFFFD   ;          omit NChar: %xAFFFE-AFFFF
                  / %xB0000-BFFFD   ;          omit NChar: %xBFFFE-BFFFF
                  / %xC0000-CFFFD   ;          omit NChar: %xCFFFE-CFFFF
                  / %xD0000-DFFFD   ;          omit NChar: %xDFFFE-DFFFF
                  / %xE0000-EFFFD   ;          omit NChar: %xEFFFE-EFFFF
                  / %xF0000-FFFFD   ;          omit NChar: %xFFFFE-FFFFF
                  / %x100000-10FFFD ;          omit NChar: %x10FFFE-10FFFF
name-char  = name-start / DIGIT / "-" / "."

; Restrictions on characters in various contexts
simple-start-char = %x01-08        ; omit NULL (%x00), HTAB (%x09) and LF (%x0A)
                  / %x0B-0C        ; omit CR (%x0D)
                  / %x0E-1F        ; omit SP (%x20)
                  / %x21-2D        ; omit . (%x2E)
                  / %x2F-5B        ; omit \ (%x5C)
                  / %x5D-7A        ; omit { (%x7B)
                  / %x7C           ; omit } (%x7D)
                  / %x7E-2FFF      ; omit IDEOGRAPHIC SPACE (%x3000)
                  / %x3001-10FFFF
text-char         = %x01-5B        ; omit NULL (%x00) and \ (%x5C)
                  / %x5D-7A        ; omit { (%x7B)
                  / %x7C           ; omit } (%x7D)
                  / %x7E-10FFFF
quoted-char       = %x01-5B        ; omit NULL (%x00) and \ (%x5C)
                  / %x5D-7B        ; omit | (%x7C)
                  / %x7D-10FFFF

; Character escapes
escaped-char = backslash ( backslash / "{" / "|" / "}" )
backslash    = %x5C ; U+005C REVERSE SOLIDUS "\"

; Required whitespace
s = *bidi ws o

; Optional whitespace
o = *(ws / bidi)

; Bidirectional marks and isolates
; ALM / LRM / RLM / LRI, RLI, FSI & PDI
bidi = %x061C / %x200E / %x200F / %x2066-2069

; Whitespace characters
ws = SP / HTAB / CR / LF / %x3000

#!/bin/bash

ES_BINARY=/home/grant/elasticsearch-0.18.7/bin/elasticsearch

if [ -z "$1" ]
then
    sudo $0 as-root $USER
    stty sane
elif [ "$1" = "as-root" ]
then
    ORIGINAL_USER=$2
    echo "Increasing ulimit"
    ulimit -n 4096
    su -c "$0 start-es" $ORIGINAL_USER
elif [ "$1" = "start-es" ]
then
    echo "Starting ES"
    $ES_BINARY &
    sleep 5
else
    echo "Unknown argument: '$1'"
fi
