#!/bin/bash

if [ "$1" == "openshift" ]; then
  if [ -e ".repo_swap/.flag_repo_openshift" ]; then
    echo "Openshift repository already active."
    exit
  fi

  #update tracking flags
  echo "Setting repository to openshift";
  rm ".repo_swap/.flag_repo_github";
  touch ".repo_swap/.flag_repo_openshift";

  #update .git
  mv .git .git_github
  mv .git_openshift .git

  #update .gitignore
  mv .gitignore .gitignore_github
  mv .gitignore_openshift .gitignore

fi

if [ "$1" == "github" ]; then
  if [ -e ".repo_swap/.flag_repo_github" ]; then
    echo "Github repository already active."
    exit
  fi

  #update tracking flags
  echo "Setting repository to github";
  rm ".repo_swap/.flag_repo_openshift";
  touch ".repo_swap/.flag_repo_github";

  #update .git
  mv .git .git_openshift
  mv .git_github .git

  #update .gitignore
  mv .gitignore .gitignore_openshift
  mv .gitignore_github .gitignore

fi
