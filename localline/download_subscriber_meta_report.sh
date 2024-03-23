#!/bin/bash

# Define the URL of the file
file_url="https://metabase.localline.ca/public/question/6345481e-188f-4b91-b1bb-a47499893385.csv"

# Define the local directory to store the file
data_directory="data"

# Generate a filename based on the URL
filename='upcoming_subscriptions_report.csv'

# Define the local path for the downloaded file
local_path="$data_directory/$filename"

# Download the file
wget -O  "$local_path" "$file_url"

# Check if there are any changes in the file
if git diff --quiet "$local_path"; then
    echo "No changes in the file."
else
    # Add the file to the Git repository
    git add "$local_path"

    # Commit the changes
    git commit -m "Update data file: $filename"

    # Push the changes to the remote repository
    git push origin main # Change "master" to your branch if needed
fi
