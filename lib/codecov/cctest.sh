#!/bin/bash
java -Xmx1024m -jar lib/codecov/JsTestDriver-1.3.4.b.jar \
  --reset \
  --tests "all" \
  --testOutput TEST_RESULTS_DIR \
  --server http://localhost:9876 \
  --config jsTestDriver.conf \
  --runnerMode=DEBUG_NO_TRACE > ./output.tmp

# Cat full output first (so we can track down errors, etc.)
cat output.tmp

# Now make a nice little summary
cat output.tmp | grep -e "Total.*tests.*Passed.*Fails.*Errors" | awk 'BEGIN {print "------------- SUMMARY --------------\nTotal    Passed   Fails  Errors";} \
{print $2, "    ", $5, "    ", $7, "    ", $9}' | sed 's/[^A-z0-9 -]//g'

rm ./output.tmp
