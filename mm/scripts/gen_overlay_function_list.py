import argparse
import json


def clean_hex(hex_string):
    return hex(int(hex_string, 16))[2:].upper()


def make_overlay_function_list(input_filename, output_filename):
    # with heavy inspiration from https://github.com/zeldaret/mm/tools/progress.py
    in_section_list = False
    in_code_area = False
    function_groups = {}  # dict of vramStart to function group
    current_function_group = None

    with open(input_filename, "r") as f:
        for line in f:
            if line.startswith('OUTPUT('):
                # Quit, we're at the end
                break

            if not in_section_list:
                in_section_list = line.startswith('Linker script and memory map')
                continue

            # process section list stuff
            pieces = list(filter(None, line.split()))

            if len(pieces) > 0 and not line.startswith(' '):
                # e.g.
                # ovl_Bg_Ikana_Ray
                current_section = pieces[0]
            elif len(pieces) == 1 and pieces[0].startswith("build/"):
                # e.g.
                # build/asm/ovl_Bg_Ikana_Bombwall_0x80BD4720.o(.text)
                # build/asm/ovl_Bg_Ikana_Bombwall_data.o(.text)
                pass
            elif len(pieces) == 4 and pieces[0].startswith("."):
                # e.g.
                # .text          0x0000000080bd4720      0xb30 build/asm/ovl_Bg_Ikana_Bombwall_0x80BD4720.o
                # .text          0x0000000080bd5250      0x170 build/asm/ovl_Bg_Ikana_Bombwall_data.o
                in_code_area = (
                        pieces[0] == ".text"
                        and "_data" not in pieces[3]
                        and "_overlay" not in pieces[3]
                )
                if in_code_area:
                    # new function current_function_group
                    vram_start = clean_hex(pieces[1])  # hex => int => hex to strip unnecessary leading zeroes
                    if vram_start in function_groups:
                        current_function_group = function_groups[vram_start]
                    else:
                        current_function_group = {
                            "section": current_section,
                            # "vramStart": int(pieces[1], 16),
                            "functions": {}
                        }
                        function_groups[vram_start] = current_function_group
            elif len(pieces) == 2 and in_code_area:
                address = clean_hex(pieces[0])
                function_name = pieces[1]
                current_function_group["functions"][address] = function_name

    # print(function_groups)
    with open(output_filename, "w") as f:
        f.write(json.dumps(function_groups, indent=4))


def main():
    parser = argparse.ArgumentParser(
        description="Generates a json file of functions in overlays using mm.map from the mm repository"
    )
    parser.add_argument("input_filename", help="path to mm.map")
    parser.add_argument("output_filename", help="assembly files to check")
    args = parser.parse_args()

    make_overlay_function_list(args.input_filename, args.output_filename)


if __name__ == "__main__":
    main()
