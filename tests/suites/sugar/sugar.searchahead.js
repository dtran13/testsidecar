describe("searchahead", function() {
    var $input, div, form;

    beforeEach(function() {
        div = $("<div id='searchForm' />");
        form = $('<form />');
        $input = $('<input />');
        div.append(form.append($input));
        $input.searchahead({
            request: function() {},
            compiler: function() {}
        });
    });
    afterEach(function() {
        $input = null;
    });

    it("should listen to input", function() {
        expect($input.data('events').blur).toBeDefined();
        expect($input.data('events').keypress).toBeDefined();
        expect($input.data('events').keyup).toBeDefined();
    });
    it('should provide sensible defaults', function() {
        expect($input.searchahead().data('searchahead').throttle).toBeDefined();
        expect($input.searchahead().data('searchahead').throttleMillis).toBe(250);
        expect($input.searchahead().data('searchahead').minChars).toBe(1);
        expect($input.searchahead().data('searchahead').$button).toBeNull();
    });
    it("should create a menu", function () {
        expect($input.searchahead().data('searchahead').$menu).toBeDefined();
    });
    it("should menu with dropdown-menu container", function () {
        expect(/dropdown.*/.test($input.searchahead().data('searchahead').$menu[0].outerHTML)).toBeTruthy();
        expect(/xxx/.test($input.searchahead().data('searchahead').$menu[0].outerHTML)).toBeFalsy();
    });
    it("should have mouseover on the $menu", function() {
        var $menu = $input.searchahead().data('searchahead').$menu;
        expect($menu.data('events').mouseover).toBeDefined();
    });

    it("should define public methods disable and enable", function() {
        var $menu = $input.searchahead().data('searchahead').$menu;
        expect(typeof $input.searchahead().data().searchahead.enable === 'function').toBe(true);
        expect(typeof $input.searchahead().data().searchahead.disable === 'function').toBe(true);
    });
    it("should enable", function() {
        var searchahead = $input.data('searchahead');
        searchahead.enable();
        expect(searchahead.disabled).toBe(false);
    });
    it("should disable", function() {
        var clock, enableSpy, hideSpy, setTimeoutSpy, searchahead;
        clock = sinon.useFakeTimers(),
        searchahead   = $input.data('searchahead');
        hideSpy       = sinon.spy(searchahead, "hide");
        enableSpy     = sinon.spy(searchahead, "enable");
        setTimeoutSpy = sinon.spy(window, 'setTimeout');

        searchahead.disable(12);
        // A bit fragile but if we change the implementation we can change the test ;)
        expect(setTimeoutSpy.getCall(0).args[1]).toEqual(searchahead.throttleMillis);
        expect(setTimeoutSpy.getCall(1).args[1]).toEqual(12);
        expect(hideSpy).toHaveBeenCalled();
        clock.tick(50);
        expect(enableSpy).toHaveBeenCalled();

        // Cleanup
        searchahead.hide.restore();
        window.setTimeout.restore();
        clock.restore();
        searchahead.disabled = false;
    });

    it("should call lookup when search term entered", function() {
        var searchahead = $input.data('searchahead'),
            spy = sinon.spy(searchahead, 'onSearch');
        $input.val('a');
        $input.trigger({
            type: 'keyup',
            keyCode: 65
        });
        expect(spy).toHaveBeenCalled();
        expect(spy.getCall(0).args[0].keyCode).toEqual(65);
        searchahead.$menu.remove();
        spy.restore();
    });

    it("should call lookup when buttonLookup button clicked", function(){
        var searchahead, spy;
        searchahead = $input.data('searchahead'),
        spy = sinon.spy(searchahead, 'lookup');
        searchahead.buttonLookup($.Event("click"));
        expect(spy).toHaveBeenCalled();
        spy.restore();
    });

    it("should move", function(){
        var searchahead, $menu, active, spy;
        searchahead = $input.data('searchahead');
        spy = sinon.spy(searchahead, 'move');

        $menu = $input.searchahead().data('searchahead').$menu;
        $menu.append("<li>foo</li><li>bar</li><li>baz</li>");
        searchahead.move('next');
        expect(spy).toHaveBeenCalled();
        expect(spy.callCount).toEqual(1);
        searchahead.move('prev');
        expect(spy.callCount).toEqual(2);
        $menu.find('.active').removeClass('active');
        spy.restore();
    });

    it("should take proper actions when keypress called with keycodes", function(){
        var searchahead, $menu, active, spy, prevSpy, nextSpy, myevent;
        searchahead = $input.data('searchahead');
        prevSpy = sinon.spy(searchahead, 'prev');
        nextSpy = sinon.spy(searchahead, 'next');

        $menu = $input.searchahead().data('searchahead').$menu;
        $menu.append("<li>foo</li><li>bar</li><li>baz</li>");
        searchahead.shown = true;

        // Neither Next/Previous called on things like Escape key
        myevent = $.Event('keydown', {keyCode: 27}); // escape
        spy = sinon.spy(myevent, 'preventDefault');
        searchahead.keypress(myevent);
        expect(spy).toHaveBeenCalled();
        expect(prevSpy).not.toHaveBeenCalled();
        expect(nextSpy).not.toHaveBeenCalled();
        spy.restore();

        // Previous gets called
        myevent = $.Event('keydown', {keyCode: 38}); // up arrow
        spy = sinon.spy(myevent, 'preventDefault');
        searchahead.keypress(myevent);
        expect(spy).toHaveBeenCalled();
        expect(prevSpy).toHaveBeenCalled();
        expect(nextSpy).not.toHaveBeenCalled();
        spy.restore();

        // Next gets called
        myevent = $.Event('keydown', {keyCode: 40}); // down arrow
        spy = sinon.spy(myevent, 'preventDefault');
        prevSpy.reset(); // since it got called earlier ;=)
        searchahead.keypress(myevent);
        expect(spy).toHaveBeenCalled();
        expect(prevSpy).not.toHaveBeenCalled();
        expect(nextSpy).toHaveBeenCalled();
        spy.restore();
        prevSpy.restore();
        nextSpy.restore();
    });

    it("should not call lookup when down, arrow, escape chars entered", function() {
        var searchahead = $input.data('searchahead'),
            spy = sinon.spy(searchahead, 'onSearch');
        $input.val('a');
        $input.trigger({
            type: 'keyup',
            keyCode: 40
        });
        expect(spy).not.toHaveBeenCalled();
        $input.trigger({
            type: 'keyup',
            keyCode: 38
        });
        expect(spy).not.toHaveBeenCalled();
        $input.trigger({
            type: 'keyup',
            keyCode: 27
        });
        expect(spy).not.toHaveBeenCalled();
        searchahead.$menu.remove();
    });

    it('should provide an optional options.context', function() {
        var clock = sinon.useFakeTimers(),
            searchahead = $input.data('searchahead'),
            onEnterSpy  = sinon.spy.create(),
            requestSpy  = sinon.spy.create(),
            myContext   = {
                request: requestSpy,
                onEnterFn: onEnterSpy
            },
            term = 'abc',
            div = $("<div id='searchForm' />"),
            form = $('<form />');
        $input = $('<input />');
        div.append(form.append($input));

        $input.searchahead({
            context: myContext,
            request: myContext.request,
            compiler: function(o) {
                return '<li>'+JSON.parse(o.data).yes+'</li>';
            },
            onEnterFn: myContext.onEnterFn,
            menu: '<ul class="typeahead dropdown-menu"></ul>'
        });
        // Verify request callback on our custom context is called
        $input.val(term);
        $input.trigger({
            type: 'keyup',
            keyCode: 65
        });
        clock.tick(300);
        expect(requestSpy).toHaveBeenCalledWith(term);
        $input.trigger({
            type: 'keyup',
            keyCode: 13
        });
        expect(onEnterSpy).toHaveBeenCalledWith(term);
        clock.restore();
    });

    it("should call provided functions", function() {
        var searchahead = $input.data('searchahead'),
            onEnterSpy  = sinon.spy.create(),
            clock = sinon.useFakeTimers();
        // Create fresh new searchahead so it doesn't reuse from beforeEach
        div = $("<div id='searchForm' />");
        form = $('<form />');
        $input = $('<input />');
        div.append(form.append($input));

        $input.searchahead({
            request: function() {
                var plugin = this;
                setTimeout(function() {
                    plugin.provide('{"yes": "it works"}');
                }, 20);
            },
            compiler: function(o) {
                return '<li>'+JSON.parse(o.data).yes+'</li>';
            },
            minChars: -1,
            throttleMillis: 20,
            onEnterFn: onEnterSpy,
            menu: '<ul class="typeahead dropdown-menu"></ul>'
        });

        $input.val('a');
        $input.trigger({
            type: 'keyup',
            keyCode: 65
        });
        clock.tick(100);
        expect($input.data('searchahead').minChars).toBe(-1);
        // some browsers will add style="" ,etc., so use regex so not brittle ;=)
        expect($input.data('searchahead').$menu[0].outerHTML).toMatch(/<ul.*class="typeahead dropdown-menu.*class="active.*it works/);

        // ENTER with no term
        $input.val('');
        $input.trigger({
            type: 'keyup',
            keyCode: 13
        });
        expect(onEnterSpy).not.toHaveBeenCalled();

        $input.val('xyz');
        searchahead.show(); // manually call show so we don't have to provide compiler, etc.
        $input.trigger({
            type: 'keyup',
            keyCode: 13
        });
        clock.tick(100);
        expect(onEnterSpy).toHaveBeenCalled();
        clock.restore();
    });

    it("should URI encode Go button and View All hrefs (bug55572)", function(){
        var onEnterSpy  = sinon.spy.create()
            clock = sinon.useFakeTimers();
        // Create fresh new searchahead so it doesn't reuse from beforeEach
        div = $("<div id='searchForm' />");
        form = $('<form />');
        $input = $('<input />');
        div.append(form.append($input));
        //Query term with characters to be URI encoded
        $input.val('% \u00E4');
        $input.searchahead({
            request: function() {
                var plugin = this;
                setTimeout(function() {
                    plugin.provide('{}');
                }, 20);
            },
            compiler: function(o) {
                return '<li>'+o.term+'</li>';
            },
            minChars: -1,
            throttleMillis: 20,
            onEnterFn: onEnterSpy,
            menu: '<ul class="typeahead dropdown-menu"></ul>'
        });
        //Go function should URI encode term
        var searchahead = $input.data('searchahead');
        searchahead.go();
        clock.tick(20);
        expect(onEnterSpy.getCall(0).args[0]).toEqual("%25%20%C3%A4");
        expect(onEnterSpy.getCall(0).args[1]).toEqual(false);

        //List items (like View All link) should use URI encoded search terms
        $input.trigger({
            type: 'keyup',
            keyCode: 65
        });

        clock.tick(100);
        expect($input.data('searchahead').$menu[0].innerHTML).toMatch(/<li class=".+">\%25\%20\%C3\%A4<\/li>/);
        clock.restore();
    });
});

