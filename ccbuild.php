<?php
/**
 * This script is used to prepare the jsTestDriver.conf which (at time of writing) is required to be in 
 * project root directory. There are some odd bugs with jstestdriver and corresponding coverage plugin.
 * For example, the excluded files list must use absolute paths, ../ cannot be used, and other quirks. 
 *
 * ** NOTE ** THIS SCRIPT MUST BE RAN FROM ROOT SIDECAR DIRECTORY
 *
 * Usage (also see the printInstructions routine below)
 * php ccbuild.php
 * 
 * Results in ./ccserver.sh, ./cctest.sh, and ./jsTestDriver.conf
 * Now you'll need to:
 * ./ccserver.sh &; # start the jstestdriver server
 * open http://localhost:9876/capture # will capture browser of choice
 * ./cctest.sh # runs tests
 * This should output the xml results to ./TEST_RESULTS_DIR 
 * ./ccgenhtml.sh # generates html reports
 **/
define("TEMPLATE", "./lib/codecov/jsTestDriver.conf.template");

require('src/include-manifest.php');

function buildExcludeFilesArgs() 
{
    // Files we want excluded from our test coverage results.
    $excludeFiles = array(
        'config.js',
        '/tests/config.js',
        '/tests/spec-helper.js',
        '/tests/spec-helper-jstestdriver.js',
    );

    // Glob directories we know we want to exclude all from
    $specs    = recursiveFetch('./tests/suites', null, '.js');
    $fixtures = recursiveFetch('./tests/fixtures', null, '.js');
    $jsonFixtures = recursiveFetch('./tests/fixtures', null, '.json');
    $libs     = recursiveFetch('./lib', array('sugar'), '.js');
    $excludeFiles = array_merge($excludeFiles, $specs, $fixtures, $jsonFixtures, $libs);

    // Build a big comma delimited string with exclude files 
    array_walk($excludeFiles, function(&$value, $indx, $currDir){ $value = $currDir . $value . ','; }, getcwd());
    $args = implode('', $excludeFiles);
    $args = substr($args, 0, strlen($args)-1);
    return $args;
}
/**
 * Recursively search for file extension type files from start directory.
 * @param $startDir directory to start recursive search from
 * @param $exclude array of files to exclude from search
 * @param $extension file extension 
 * @param $stripLeadingForwardSlash a boolean to strip off first '/' in /foo/bar
 * @return array An array of files found in recursive search.
 */ 
function recursiveFetch($startDir, $exclude, $extension, $stripLeadingForwardSlash=false) {
    $filesArray = array();

    $dirItr = new RecursiveDirectoryIterator($startDir);
    $itrItr = new RecursiveIteratorIterator($dirItr);
    foreach($itrItr as $path => $file) {
        // Is it the right extension?
        if (substr(basename($path), (-1*strlen($extension))) != $extension)
            continue;

        // Loop $exclude (if exists), and if this file in in that list skip
        $skip = false;
        if(isset($exclude)) {
            foreach($exclude as $ex){
                if (strpos($path, $ex) !== false) {
                    $skip = true;
                    break;
                }
            }
            if ($skip) continue;
        }

        // $path contains cwd dot: ./foo/bar .. so strip that off
        if (isset($stripLeadingForwardSlash) && $stripLeadingForwardSlash) {
            $path = substr($path, 2);
        } else {
            $path = substr($path, 1);
        }
        array_push($filesArray, $path);
    }
    return $filesArray;
}


function copyScripts() {
    $serverscript = 'lib/codecov/ccserver.sh';
    $testscript   = 'lib/codecov/cctest.sh';
    $genhtmlscript= 'lib/codecov/ccgenhtml.sh';
    $destserverscript = './'.basename($serverscript);
    $desttestscript   = './'.basename($testscript);
    $desthtmlscript   = './'.basename($genhtmlscript);
    if (!copy($serverscript, $destserverscript)) {
        echo "Failed to copy $serverscript.";
    } else {
        chmod($destserverscript, 0755);
    }
    if (!copy($testscript, './'.basename($testscript))) {
        echo "Failed to copy $testscript.";
    } else {
        chmod($desttestscript, 0755);
    }
    if (!copy($genhtmlscript, './'.basename($genhtmlscript))) {
        echo "Failed to copy $genhtmlscript.";
    } else {
        chmod($desthtmlscript, 0755);
    }
}
// Copies over template file from lib/codecov/jsTestDriver.conf.template to
// ./jsTestDriver.conf and adds the file exclude property (args: <filelist>)
// as well as the load property (load: <filelist>)
function buildConfig($sidecarFilesArray, $excludeFilesArgs) {

    // This is the key for the jstestdriver code coverage property that excludes files
    $excludeFilesKey = "args:";

    // This is the key for the files jstestdriver will load
    $loadFilesKey    = "load:";

    // Create the real config and copy over template contents to get started
    $realConfig      = "jsTestDriver.conf";
    copy(TEMPLATE, $realConfig) or exit("failed to copy TEMPLATE");

    // create array of lines
    $fc = fopen ($realConfig, "r");
    while (!feof ($fc)) 
    {
        $buffer = fgets($fc, 4096); 
        $lines[] = $buffer; 
    } 
    fclose ($fc); 
    // Essentially, we'll write back each line except the args: <filelist>
    // and load: <multiline filelist> ones.
    $f=fopen($realConfig,"w") or die("couldn't open $realConfig"); 
    foreach($lines as $line)
    {
        // Insert data before line with corresponding key
        if (strstr($line, $excludeFilesKey)){
            fwrite($f,'   args: '.$excludeFilesArgs."\n");
        } else if(strstr($line, $loadFilesKey)) {
            // Files to be loaded by jstestdriver .. the ordering is:
            // sidecar files (from include manifest), libs, fixtures, spec helpers, specs.
            $testLibs     = array('lib/jasmine/jasmine.js', 'lib/jasmine/jasmine-html.js', 'lib/jasmine-jquery/jasmine-jquery.js', 'lib/codecov/JasmineAdapter.js', 'lib/sinon/sinon.js', 'lib/jasmine-sinon/jasmine-sinon.js');
            $fixtures     = recursiveFetch('./tests/fixtures', null, '.js', true);
            $jsonFixtures = recursiveFetch('./tests/fixtures', null, '.json', true);
            $specHelpers  = array('tests/config.js', 'tests/spec-helper.js', 'tests/spec-helper-jstestdriver.js');
            // The following few lines put sugarapi spec at top of specs and sugar/* at bottom
            $specs        = recursiveFetch('./tests/suites', array('/sugar/', '/sugarapi/', 'tests/suites/offline'), '.js', true);
            array_unshift($specs, "tests/suites/sugarapi/sugarapi.js");
            $specs        = array_merge($specs, recursiveFetch('./tests/suites/sugar', null, '.js', true));
            $allFiles     = array_merge($sidecarFilesArray, $testLibs, $fixtures, $jsonFixtures, $specHelpers, $specs);
            $loadFiles    = buildLoadFiles($allFiles);
            fwrite($f,"load: \n".$loadFiles."\n");
        } else {
            fwrite($f,$line);//leave all other lines
        }
    }
}

function buildLoadFiles($sidecarFiles) {
    $prefix = '  - ';
    $loadFileSection = '';
    foreach ($sidecarFiles as $file) {
        $loadFileSection .= $prefix . $file . "\n";
    }
    return $loadFileSection;
}

function printInstructions() {
    echo "
--------------------------
------ Instructions ------
--------------------------
1. Run the jstestdriver server:
./ccserver.sh # Give it a sec to fully instrument code

3. Capture browser:
open <path_to_browser> http://localhost:9876/capture

4. Run the jstestdriver test runner:
./cctest.sh

5. Generate HTML reports:
./ccgenhtml.sh\n";
}

function buildSidecarSourceAndLibs($buildFiles)
{
    if ($buildFiles) {
        return _buildSidecar($buildFiles);
    } else {
        echo "You do not appear to have include-manifest.php or we were unable to parse it.";
        exit(1); 
    }    
}

function _buildSidecar($fileList)
{
    if ($fileList['sidecar']) {
        return $fileList['sidecar'];
    } else {
        echo "You do not appear to have a proper include-manifest.php or we were unable to find sidecar key.";
        exit(1);
    }
}

function writeExcludedFiles($excludeFiles) {
    $newlined = str_replace(",", "\n", $excludeFiles);
    file_put_contents('./ccexcluded_files.txt', "---Excluded Files---\n". $newlined . "\n");
}

function main($buildFiles)
{
    copyScripts();
    $sidecarFilesArray = buildSidecarSourceAndLibs($buildFiles);
    $excludeFiles = buildExcludeFilesArgs();
    buildConfig($sidecarFilesArray, $excludeFiles);
    writeExcludedFiles($excludeFiles);
    printInstructions();
}
main($buildFiles);
