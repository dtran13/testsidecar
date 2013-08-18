describe('app.cache', function () {
    var app;

    beforeEach(function () {
        app = SugarTest.app; // from spec-helper
        app.cache.store = stash;
        app.cache.cutAll();
    });

    afterEach(function () {
        app.cache.cutAll();
    });

    it('should store strings', function () {
        var value = "This is a test.",
            key = "testKey";
        app.cache.set(key, value);
        expect(app.cache.get(key)).toEqual(value);
    });

    it('should store objects', function () {
        var value = {foo: "test", bar:{more:"a"}},
            key = "testKey";
        app.cache.set(key, value);
        expect(app.cache.get(key)).toEqual(value);
    });

    it('should store functions', function () {
        var func = function(){return "Hello World";},
            key = "testKey";
        app.cache.set(key, func);
        expect(app.cache.get(key)()).toEqual(func());
    });

    it('should store DOM elements', function () {
        var el = document.createElement("div"), key;
        el.id = "testID";
        el.className = "Test";
        key = "testKey";
        app.cache.set(key, el);
        //Ensure it is an element
        expect(app.cache.get(key) instanceof HTMLElement).toBeTruthy();
        //And it has all the expected properties
        expect(app.cache.get(key).id).toEqual(el.id);
        expect(app.cache.get(key).className).toEqual(el.className);

    });

    it('should append values', function () {
        var value = "Hello",
            key = "testKey";
        app.cache.set(key, value);
        expect(app.cache.get(key)).toEqual(value);

        app.cache.add(key, " World");
        expect(app.cache.get(key)).toEqual("Hello World");
    });


    it('should remove values', function () {
        var value = "Hello",
            key = "testKey";
        app.cache.set(key, value);
        expect(app.cache.get(key)).toEqual(value);

        app.cache.cut(key);
        expect(app.cache.get(key)).toBeFalsy();
    });

    it('should provide has to determine if key exists', function () {
        var value = "Hello",
            key = "testKey";
        app.cache.set(key, value);
        app.cache.cut(key);
        expect(app.cache.has(key)).toBeFalsy();
    });

    it('should remove all values', function () {
        var value = "Hello",
            key = "testKey",
            key2 = "testKey2";
        app.cache.set(key, value);
        app.cache.set(key2, value);
        expect(app.cache.get(key)).toEqual(value);
        expect(app.cache.get(key2)).toEqual(value);

        app.cache.cutAll();
        expect(app.cache.get(key)).toBeFalsy();
        expect(app.cache.get(key2)).toBeFalsy();
    });


});
