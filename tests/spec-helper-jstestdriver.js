// Assumption that this file is loaded after main spec-helper.js so SugarTest is defined.
// We need to hijack loadFixture because jstestdriver has it's own root path and prepends 'test'
SugarTest.loadFixture = function(file) {
    return SugarTest.loadFile('/test/tests/fixtures', file, 'json', function(data) { return data; }, 'json');
};

SugarTest.componentsFixtureSrc = "/test/tests/fixtures/components.js";

