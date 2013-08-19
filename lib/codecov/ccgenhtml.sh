#!/usr/bin/env bash

TEST_RESULTS="TEST_RESULTS_DIR"
OUT="${TEST_RESULTS}/html"
/Users/dtran/Downloads/lcov-1.9/bin/genhtml -o ${OUT} --title --function-coverage --branch-coverage --highlight ${TEST_RESULTS}/jsTestDriver.conf-coverage.dat

echo '
To view generated reports:
open ./TEST_RESULTS_DIR/html/index.html
or just open directly in browser something like:
file:///path/to/sidecar/TEST_RESULTS_DIR/html/index.html
';

# Not sure why they'd try to terminate but ya never know ;=)
trap "rm -f ./ccexcluded_files.txt ./ccserver.sh ./cctest.sh ./ccgenhtml.sh ./jsTestDriver.conf;" EXIT

