#!/bin/bash
# 1. run this script
# 2. Open up http://localhost:9876/capture
# 3. run cctest.sh
java -Xmx1024m -jar lib/codecov/JsTestDriver-1.3.4.b.jar \
  --port 9876 \
  --config jsTestDriver.conf \
  --runnerMode=DEBUG_NO_TRACE
