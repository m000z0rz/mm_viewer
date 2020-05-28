#!/bin/bash

python3 gen_cm_actor_list.py ../static/cm_actor_list.tsv
python3 gen_overlay_function_list.py ~/reversing/mm/build/mm.map ../definitions/overlay_functions.json
