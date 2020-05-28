import argparse
import json


def clean_hex(hex_string):
    return hex(int(hex_string, 16))[2:].upper()


def make_types_list(input_filename, output_filename):

    global_variables = []

    print(global_variables)
    with open(output_filename, "w") as f:
        f.write(json.dumps(global_variables, indent=4))


def main():
    parser = argparse.ArgumentParser(
        description="Generates a json file of types using struct.h from the mm repository"
    )
    parser.add_argument("input_filename", help="path to mm.map")
    parser.add_argument("output_filename", help="assembly files to check")
    args = parser.parse_args()

    make_types_list(args.input_filename, args.output_filename)


if __name__ == "__main__":
    main()
