import pandas as pd
import os
import shutil
from rs_df_converter import rs_df_converter


def pomGenerator(output_repo="./", xpath_repo="./", root_repo="./",base_page_repo="./"):
    
    os.makedirs(output_repo, exist_ok=True)
    shutil.copy(base_page_repo, os.path.join(output_repo, "BasePage.ts"))
    output_repo = os.path.join(output_repo, "Pages")
    os.makedirs(output_repo, exist_ok=True)

    try:
        if (xpath_repo.lower().endswith(".csv")):
            src_df = pd.read_csv(xpath_repo)
        elif  (xpath_repo.lower().endswith(".xlsx") or xpath_repo.lower().endswith("xls")  ):
            src_df = pd.read_excel(xpath_repo)
        else:
            src_df = rs_df_converter(xpath_repo)
    except Exception as e:
        print("Error data")
        return

    for _, TS_files in src_df.iterrows():
        file_path = str(TS_files["File"])
        obj_name = str(TS_files["Object_Name"])
        obj_value = str(TS_files["Value"])

        
        try:
            rel_path = os.path.relpath(file_path, start=root_repo)
        except ValueError:
            rel_path = file_path

        
        rel_dir = os.path.dirname(rel_path)

        
        new_dir = os.path.join(output_repo, rel_dir)
        os.makedirs(new_dir, exist_ok=True)        
        final_file_name = os.path.join(new_dir, "pom.ts")

        
        if not os.path.exists(final_file_name):
            skeleton = """\
import { Locator } from '@playwright/test';
import { BasePage } from '@pageManager/BasePage';

export class POM extends BasePage {
}
"""
            with open(final_file_name, "w", encoding="utf-8") as f:
                f.write(skeleton)

        
        locator_line = f'\t\treadonly {obj_name}: Locator = this.page.locator("{obj_value}");\n' + "}"

        with open(final_file_name, "r", encoding="utf-8") as f:
            content = f.read()

        last_idx = content.rfind("}")
        if last_idx == -1:
            content = content + "\n" + locator_line
        else:
            content = content[:last_idx] + locator_line

        with open(final_file_name, "w", encoding="utf-8") as f:
            f.write(content)


if __name__ == "__main__":
    pomGenerator(
        output_repo="C:/Users/2418120/OneDrive - Cognizant/Desktop/Testenv/Object Repository",
        xpath_repo="C:\\Users\\2418120\OneDrive - Cognizant\\Desktop\\agent-directives\\Manual-Code\ExampleDir\\Output\\Object Repository.csv",
        root_repo="C:/Users/2418120/OneDrive - Cognizant/Desktop/agent-directives/Manual-Code/Object Repository Inspection Agent/Object Repository",
        base_page_repo="./resources/BasePage.ts"
    )