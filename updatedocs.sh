#!/bin/bash

# clone the assist library and cd into it
# Check if the directory 'assist' already exists
if [ ! -d "assist" ]; then
    # 'assist' directory does not exist, so clone the repository
    git clone https://github.com/logicalmechanism/assist.git
    # Change into the 'assist' directory only if the clone was successful
    if [ $? -eq 0 ]; then
        cd assist/
    else
        echo "Clone failed, not changing directory."
    fi
else
    echo "Directory 'assist' already exists, skipping clone."
    # Change into the 'assist' directory since it exists
    cd assist/
fi

# get main and update it
git checkout main
git pull origin main

# remove old folder and rebuild the docs
rm -fr docs/
aiken docs

# remove website docs and replace it with newly built docs
rm -fr ../docs/
cp -r docs/ ../docs
cd ..

# remove it.
rm -fr assist/