# Scrapes data off Cloud Modding's Actor List table to identify actors
#   from https://wiki.cloudmodding.com/mm/Actor_List

import urllib.request
import argparse

from bs4 import BeautifulSoup


# soup = BeautifulSoup(html_doc, 'html.parser')

url = "https://wiki.cloudmodding.com/mm/Actor_List"


def get_url(url):
    request = urllib.request.urlopen(url)
    bytes = request.read()
    request.close()
    return bytes.decode("utf8")


def get_soup(url):
    html = get_url(url)
    return BeautifulSoup(html, "html.parser")


def make_actor_list(output_filename):
    # print(get_url(url))
    s = get_soup(url)
    table = s.find("span", text="Actor List").findNext("table")
    with open(output_filename, "w") as f:
        # write header
        f.write("\t".join(["id", "filename", "objectID", "translation", "description", "used"]) + "\n")
        for row in table.find_all("tr"):
            values = [td.text.strip().replace("\t", "") for td in row.find_all("td")]
            if len(values) != 6:
                continue  # skips header, which has th instead of td

            id, filename, object_id, translation, description, used = values

            if id == "#":
                continue  # skip header

            # convert used to more typing-friendly values
            used = (used
                    .replace("✔", "t")
                    .replace("✘", "f")
                    )

            f.write("\t".join([id, filename, object_id, translation, description, used]) + "\n")

    # print(get_soup(url))


def main():
    parser = argparse.ArgumentParser(
        description="Run mips_to_c on a set of assembly files and report crashes. Outputs TODO"
    )
    parser.add_argument("output_filename", help="assembly files to check")
    args = parser.parse_args()

    make_actor_list(args.output_filename)



if __name__ == "__main__":
    main()
