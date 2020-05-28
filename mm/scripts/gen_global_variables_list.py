from os import path
import sys
import argparse
import json

from pycparser import c_parser, c_ast, parse_file


def clean_hex(hex_string):
    return hex(int(hex_string, 16))[2:].upper()


#   [
#       {
#         "name": "actorCutscenesGlobalCtxt",
#         "offset": 0x801BD8C0,
#         "typeName": "GlobalContext*",
#       }
#   [
def make_global_variables_list(input_filename, output_filename):
    global_variables = []

    parser = c_parser.CParser()

    with open(input_filename, "r") as f:
        c = f.read()

    try:
        # node = parser.parse(c, filename=path.basename(input_filename))
        cpp_args = [
            "-C"  # don't strip comments
            , "-E"  # preprocess only
            , "-nostdinc"  # don't include system includes
            , r"-I./fake_include"  # diretory for header inclusions
        ]
        node = parse_file(input_filename, use_cpp=True, cpp_args=cpp_args)
    except c_parser.ParseError as e:
        print("Parse error: " + str(e))
        # e = sys.exc_info()[1]
        # return "Parse error:" + str(e)

    # print(node)

    print(global_variables)
    with open(output_filename, "w") as f:
        f.write(json.dumps(global_variables, indent=4))


def main():
    parser = argparse.ArgumentParser(
        description="Generates a json file of global variables using variables.h from the mm repository"
    )
    parser.add_argument("input_filename", help="path to mm.map")
    parser.add_argument("output_filename", help="assembly files to check")
    args = parser.parse_args()

    make_global_variables_list(args.input_filename, args.output_filename)


if __name__ == "__main__":
    main()
