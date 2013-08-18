describe("Utils", function() {

    var utils = SUGAR.App.utils;
    var user = SUGAR.App.user;

    describe("strings", function() {
        it("should capititalize a string", function() {
            var result = utils.capitalize('abc');
            expect(result).toEqual("Abc");
            result = utils.capitalize('a');
            expect(result).toEqual("A");
            result = utils.capitalize('aBC');
            expect(result).not.toEqual("Abc");
            expect(result).toEqual("ABC");//preserves subsequent chars
        });
        it("should return empty string from capititalize for falsy input", function() {
            var result = utils.capitalize(undefined);
            expect(result).toEqual("");
            result = utils.capitalize(null);
            expect(result).toEqual("");
            result = utils.capitalize();
            expect(result).toEqual("");
        });

        it("should capititalize hyphenated strings", function() {
            var result = utils.capitalizeHyphenated('abc-def');
            expect(result).toEqual("AbcDef");
            result = utils.capitalizeHyphenated('a');
            expect(result).toEqual("A");
            result = utils.capitalizeHyphenated('aBC-dEF');
            expect(result).not.toEqual("AbcDef");
            expect(result).toEqual("ABCDEF");//preserves subsequent chars
        });

        it("should return empty string from capitalizeHyphenated for falsy input", function() {
            var result = utils.capitalizeHyphenated(undefined);
            expect(result).toEqual("");
            result = utils.capitalizeHyphenated(null);
            expect(result).toEqual("");
            result = utils.capitalizeHyphenated();
            expect(result).toEqual("");
        });
    });

    describe("string formatter", function(){
        it("should insert string substitutions",function(){
            var string = utils.formatString("Hello {0}, would you like to look at {1}?",["User","an Account"]);
            expect(string).toEqual("Hello User, would you like to look at an Account?");
        });

        it("should allow unused and partial arguments", function(){
            var string = utils.formatString("Hello World",["User","an Account"]);
            expect(string).toEqual("Hello World");
            var string = utils.formatString("Hello {0}, would you like to look at {1}?",["User"]);
            expect(string).toEqual("Hello User, would you like to look at {1}?");
        });

        it("should allow null or undefined arguments",function(){
            var string = utils.formatString("Hello computer?",null);
            expect(string).toEqual("Hello computer?");
            string = utils.formatString("Computer?  Are you there?");
            expect(string).toEqual("Computer?  Are you there?");
        });

    });

    describe("number formatter", function() {
        it("should round up numbers", function() {
            var value = 2.3899,
                round = 2,
                precision = 2,
                number_group_seperator = ",",
                decimal_seperator = ".",
                result = utils.formatNumber(value, round, precision, number_group_seperator, decimal_seperator);

            expect(result).toEqual("2.39");
        });

        it("should round down numbers", function() {
            var value = 2.3822,
                round = 2,
                precision = 2,
                number_group_seperator = ",",
                decimal_seperator = ".",
                result = utils.formatNumber(value, round, precision, number_group_seperator, decimal_seperator);
            expect(result).toEqual("2.38");
        });

        it("should set precision on numbers", function() {
            var value = 2.3828,
                round = 4,
                precision = 2,
                number_group_seperator = ",",
                decimal_seperator = ".",
                result = utils.formatNumber(value, round, precision, number_group_seperator, decimal_seperator);
            expect(result).toEqual("2.38");
        });

        it("should add the correct number group seperator", function() {
            var value = 2123.3828,
                round = 4,
                precision = 2,
                number_group_seperator = " ",
                decimal_seperator = ".",
                result = utils.formatNumber(value, round, precision, number_group_seperator, decimal_seperator);
            expect(result).toEqual("2 123.38");
        });

        it("should return non-number objects without modification", function() {
            var value = [1,2,3],
                round = 2,
                precision = 2,
                number_group_seperator = "",
                decimal_seperator = ".",
                result = utils.formatNumber(value, round, precision, number_group_seperator, decimal_seperator);
            expect(result).toEqual([1,2,3]);
            value = undefined;
            result = utils.formatNumber(value, round, precision, number_group_seperator, decimal_seperator);
            expect(result).toBeUndefined();
            value = null;
            result = utils.formatNumber(value, round, precision, number_group_seperator, decimal_seperator);
            expect(result).toEqual(null);
            value = NaN;
            result = utils.formatNumber(value, round, precision, number_group_seperator, decimal_seperator);
            expect(_.isNaN(result)).toBeTruthy();
        });

        it("should add the correct decimal seperator", function() {
            var value = 2123.3828,
                round = 4, 
                precision = 2, 
                number_group_seperator = "", 
                decimal_seperator = ",",
                result = utils.formatNumber(value, round, precision, number_group_seperator, decimal_seperator);
            expect(result).toEqual("2123,38");
        });

        it("should format number strings to formatted number strings", function() {
            var value = "2123.3828",
                round = 4,
                precision = 2,
                number_group_seperator = "",
                decimal_seperator = ".",
                result = utils.formatNumber(value, round, precision, number_group_seperator, decimal_seperator);
            expect(result).toEqual("2123.38");
        });

        it("should return any invalid number strings without modification", function() {
            var value = "$2123.3828",
                round = 4,
                precision = 2,
                number_group_seperator = "",
                decimal_seperator = ".",
                result = utils.formatNumber(value, round, precision, number_group_seperator, decimal_seperator);
            expect(result).toEqual("$2123.3828");
            value = "..54";
            result = utils.formatNumber(value, round, precision, number_group_seperator, decimal_seperator);
            expect(result).toEqual("..54");
            value = "abcdefg";
            result = utils.formatNumber(value, round, precision, number_group_seperator, decimal_seperator);
            expect(result).toEqual("abcdefg");
        });

        it("should unformat number strings to unformatted number strings", function() {
            var value = '2,123 3828',
                number_group_seperator = ",",
                decimal_seperator = " ",
                toFloat = false,
                result = utils.unformatNumberString(value, number_group_seperator, decimal_seperator, toFloat);
            expect(result).toEqual("2123.3828");
        });

        it("should unformat number strings to floats", function() {
            var value = '2,123 3828',
                number_group_seperator = ",",
                decimal_seperator = " ",
                toFloat = true,
                result = utils.unformatNumberString(value, number_group_seperator, decimal_seperator, toFloat);
            expect(result).toEqual(2123.3828);
        });

        it("should return an empty value for ''", function() {
            var value = '',
                number_group_seperator = ",",
                decimal_seperator = " ",
                toFloat = true,
                result = utils.unformatNumberString(value, number_group_seperator, decimal_seperator, toFloat);
            expect(result).toEqual('');
        });
        it("should return an empty value for null", function() {
            var value = null,
                number_group_seperator = ",",
                decimal_seperator = ".",
                toFloat = false,
                result = utils.unformatNumberString(value, number_group_seperator, decimal_seperator, toFloat);
            expect(result).toEqual('');
        });
        it("should return an empty value for undefined", function() {
            var value = undefined,
                number_group_seperator = ",",
                decimal_seperator = ".",
                toFloat = false,
                result = utils.unformatNumberString(value, number_group_seperator, decimal_seperator, toFloat);
            expect(result).toEqual('');
        });
        it("should return an empty value for NaN", function() {
            var value = NaN,
                number_group_seperator = ",",
                decimal_seperator = ".",
                toFloat = false,
                result = utils.unformatNumberString(value, number_group_seperator, decimal_seperator, toFloat);
            expect(result).toEqual('');
        });
        it("should strip out invalid chars", function() {
            var value = '135abc456.ab23',
                number_group_seperator = ",",
                decimal_seperator = ".",
                toFloat = false,
                result = utils.unformatNumberString(value, number_group_seperator, decimal_seperator, toFloat);
            expect(result).toEqual('135456.23');
        });
    });

    describe("formatting with locale", function() {
        it("should format a number respecting user locale", function() {
            user.set('decimal_precision', 2);
            user.set('decimal_separator', '.');
            user.set('number_grouping_separator', ',');
            var amount  = '1000',
                result = utils.formatNumberLocale(amount, false);
            expect(result).toEqual('1,000.00');
        });
        it("should unformat a number respecting user locale", function() {
            user.set('decimal_precision', 2);
            user.set('decimal_separator', '.');
            user.set('number_grouping_separator', ',');
            var amount  = '1,000.00',
                result = utils.unformatNumberStringLocale(amount, false);
            expect(result).toEqual('1000.00');
        });
    });

    describe('Name formatter', function() {
        var params = {
            first_name: 'foo',
            last_name: 'boo',
            salutation: 'Mr.'
        };
        using('possible name formats', [{
            format: 'f s l',
            expected: 'foo Mr. boo'
        },{
            format: 's f l',
            expected: 'Mr. foo boo'
        },{
            format: 'f l',
            expected: 'foo boo'
        },{
            format: 's l',
            expected: 'Mr. boo'
        },{
            format: 'l, f',
            expected: 'boo, foo'
        },{
            format: 's l, f',
            expected: 'Mr. boo, foo'
        },{
            format: 'l s f',
            expected: 'boo Mr. foo'
        },{
            format: 'l f s',
            expected: 'boo foo Mr.'
        }], function(value) {
            it('should follow the naming format with name parts', function() {
                var result = utils.formatName(params, value.format);
                expect(result).toEqual(value.expected);
            });
        });

        describe('comma separator', function() {
            var params = {
                    first_name: 'foo',
                    last_name: 'boo',
                    salutation: 'Dr.'
                };
            using('possible name formats', [{
                format: 'l, f',
                expected: 'boo, foo'
            },{
                format: 's l, f',
                expected: 'Dr. boo, foo'
            }], function(value) {
                it('should print the format with comma separator when the format is provided', function() {
                    var result = utils.formatName(params, value.format);
                    expect(result).toEqual(value.expected);
                });
            });

            var params2 = {
                first_name: 'foo',
                last_name: ''
            };
            using('possible name formats', [{
                format: 'l, f',
                expected: 'foo'
            },{
                format: 's l, f',
                expected: 'foo'
            }], function(value) {
                it('should print only first name when last name is not provided', function() {
                    var result = utils.formatName(params2, value.format);
                    expect(result).toEqual(value.expected);
                });
            });
        });

        describe('trim', function() {
            var params = {
                first_name: '',
                last_name: 'boo',
                salutation: 'Dr.'
            };
            using('possible name formats', [{
                format: 'f s l',
                expected: 'Dr. boo'
            },{
                format: 's f l',
                expected: 'Dr. boo'
            },{
                format: 'f l',
                expected: 'boo'
            },{
                format: 's l',
                expected: 'Dr. boo'
            },{
                format: 'l, f',
                expected: 'boo'
            },{
                format: 's l, f',
                expected: 'Dr. boo'
            },{
                format: 'l s f',
                expected: 'boo Dr.'
            },{
                format: 'l f s',
                expected: 'boo Dr.'
            }], function(value) {
                it('should trim the space when some name parts are not provided', function() {
                    var result = utils.formatName(params, value.format);
                    expect(result).toEqual(value.expected);
                });
            });
        });
    });

    describe('formatting name with locale', function() {
        it('should format a number respecting user locale', function() {
            user.setPreference('default_locale_name_format', 's l, f');
            var params = {
                    first_name: 'foo',
                    last_name: 'boo',
                    salutation: 'Dr.'
                },
                result = utils.formatNameLocale(params);
            expect(result).toEqual('Dr. boo, foo');

            user.setPreference('default_locale_name_format', 'f s l');
            result = utils.formatNameLocale(params);
            expect(result).toEqual('foo Dr. boo');
        });
    });

    describe("regex escape", function() {
        it("should escape string for use in regex", function() {
            var string  = "abc*123",
                result = utils.regexEscape(string);
            expect(result).toEqual("abc\\*123");
            var string  = "/.*+?|()[]{}\\-.^$#",
                result = utils.regexEscape(string);
            expect(result).toEqual("\\/\\.\\*\\+\\?\\|\\(\\)\\[\\]\\{\\}\\\\\\-\\.\\^\\$\\#");
        });
    });

    describe("cookie", function() {
        it("should set cookie values", function() {
            var result = "", cName, value, i, x, y,
                ARRcookies = document.cookie.split(";");
            cName = "sidecarCookie";
            value = 'asdf';
            SUGAR.App.utils.cookie.setCookie(cName, value, 1);

            ARRcookies = document.cookie.split(";");
            for (i = 0; i < ARRcookies.length; i++) {
                x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
                y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
                x = x.replace(/^\s+|\s+$/g, "");
                if (x === cName) {
                    result = unescape(y);
                }
            }
            expect(result).toEqual(value);
            SUGAR.App.utils.cookie.setCookie(cName, "", 1);
        });
        it("should get cookie values", function() {
            var result = "",
                cName = "sidecarCookie",
                value = 'asdfasdf',
                exdays = 1,
                exdate = new Date(), c_value;
            exdate.setDate(exdate.getDate() + exdays);
            c_value = escape(value) + ((exdays === null) ? "" : "; expires=" + exdate.toUTCString());
            document.cookie = cName + "=" + c_value;
            result = SUGAR.App.utils.cookie.getCookie(cName);
            expect(result).toEqual(value);
            value = "";
            c_value = escape(value) + ((exdays === null) ? "" : "; expires=" + exdate.toUTCString());
        });
    });

    describe("isValidEmailAddress", function() {
        it("should accept e-mail addresses with capitals (bug55676)", function() {
            var result = utils.isValidEmailAddress('aBc@abc.com');
            expect(result).toEqual(true);
            result = utils.isValidEmailAddress('abc@aBc.com');
            expect(result).toEqual(true);
            result = utils.isValidEmailAddress('abc@abc.cOm');
            expect(result).toEqual(true);
            result = utils.isValidEmailAddress('ABC@ABC.COM');
            expect(result).toEqual(true);
        });
        it("should reject invalid e-mail addresses", function() {
            var result = utils.isValidEmailAddress('@abc.com');
            expect(result).toEqual(false);
            result = utils.isValidEmailAddress('abc@');
            expect(result).toEqual(false);
            result = utils.isValidEmailAddress('abc@ab*&^%$c.cOm');
            expect(result).toEqual(false);
            result = utils.isValidEmailAddress('');
            expect(result).toEqual(false);
            result = utils.isValidEmailAddress('Abc@abc');
            expect(result).toEqual(false);
        });
        it("should accept valid e-mail addresses", function() {
            var result = utils.isValidEmailAddress('abc@abc.com');
            expect(result).toEqual(true);
            result = utils.isValidEmailAddress('abfc@blaha.netso');
            expect(result).toEqual(true);
            result = utils.isValidEmailAddress('blah.blah@blah.blah.blah.net');
            expect(result).toEqual(true);
            result = utils.isValidEmailAddress('this.with+symbol@blah.com');
            expect(result).toEqual(true);
        });

    });

    describe("doWhen", function() {
        it("should accept strings as a condition", function() {
            var fired = false;
            utils.doWhen("SUGAR.TEST_GLOBAL_VARIABLE", function(){
                fired = true;
            })
            utils._doWhenCheck();
            expect(fired).toBeFalsy();
            SUGAR.TEST_GLOBAL_VARIABLE = true;
            //force the doWhen check since we can't rely on timing.
            utils._doWhenCheck();
            expect(fired).toBeTruthy();
            delete SUGAR.TEST_GLOBAL_VARIABLE;
        });

        it("should accept a condition function", function() {
            var go = false, fired = false;
            utils.doWhen(function(){return go}, function(){
                fired = true;
            })
            utils._doWhenCheck();
            expect(fired).toBeFalsy();
            go=true;
            utils._doWhenCheck();
            expect(fired).toBeTruthy();
        });

        it("should pass paramters to the callback", function() {
            var params = {foo :true}, fired = false;

            utils.doWhen("true", function(p){
                fired = p.foo;
            }, params);
            utils._doWhenCheck();
            expect(fired).toBeTruthy();
        });

        it("should set the context correct", function() {
            var params = {foo :true}, fired = false;

            utils.doWhen("true", function(p){
                expect(p).toBeNull();
                fired = this.foo;
            }, null, params);
            utils._doWhenCheck();
            expect(fired).toBeTruthy();
        });

        it("should use params as the context when context is 'true' ", function() {
            var params = {foo :true}, fired = false;

            utils.doWhen("true", function(p){
                //ensure the p is still set even though it is also the context
                expect(p).toBeTruthy();
                fired = this.foo;
            }, params, true);
            utils._doWhenCheck();
            expect(fired).toBeTruthy();
        });
    });

    describe("deepCopy", function() {
        it("should return an object with same values", function() {
            var input = {
                foo: 'foo',
                bar: 'bar',
                test: {
                    foo: 'foo',
                    bar: 'bar'
                }
            };
            var output = utils.deepCopy(input);

            expect(output.foo).toBe(input.foo);
            expect(output.bar).toBe(input.bar);
            expect(output.test.foo).toBe(input.test.foo);
            expect(output.test.bar).toBe(input.test.bar);
        });

        it("should return an object that has a different reference", function() {
            var input = {
                foo: 'foo',
                bar: 'bar',
                test: {
                    foo: 'foo',
                    bar: 'bar'
                }
            };

            expect(utils.deepCopy(input)).not.toBe(input);
        });

        it("should return copied object attributes with a different reference", function() {
            var input = {
                foo: 'foo',
                bar: 'bar',
                test: {
                    foo: 'foo',
                    bar: 'bar'
                }
            };
            var output = utils.deepCopy(input);

            expect(output.test).not.toBe(input.test);
        });
    });


    describe('building urls', function() {
        var app;

        beforeEach(function() {
            app = SugarTest.app;
        });

        var originalSiteUrl;
        beforeEach(function() {
            originalSiteUrl = app.config.siteUrl;
        });

        afterEach(function() {
            app.config.siteUrl = originalSiteUrl;
        });

        using('possible siteUrls', [{
            siteUrl: 'http://sugarcrm.com',
            url: 'my-path/example.png',
            expected: 'http://sugarcrm.com/my-path/example.png'
        },{
            siteUrl: 'http://sugarcrm.com/with-context',
            url: 'my-path/example.png',
            expected: 'http://sugarcrm.com/with-context/my-path/example.png'
        },{
            siteUrl: 'https://sugarcrm.com/with-context',
            url: 'my-path/example.png',
            expected: 'https://sugarcrm.com/with-context/my-path/example.png'
        },{
            siteUrl: 'http://sugarcrm.com/with-slash-context/',
            url: 'path/example.png',
            expected: 'http://sugarcrm.com/with-slash-context/path/example.png'
        },{
            siteUrl: 'http://sugarcrm.com/',
            url: 'http://example.com/my-path/example.png',
            expected: 'http://example.com/my-path/example.png'
        },{
            siteUrl: 'https://sugarcrm.com/',
            url: 'https://example.com/my-path/example.png',
            expected: 'https://example.com/my-path/example.png'
        },{
            siteUrl: 'https://sugarcrm.com/portal',
            url: '../my-path/example.png',
            expected: 'https://sugarcrm.com/portal/../my-path/example.png'
        }], function(value) {
            it('should build a correct url', function() {
                app.config.siteUrl = value.siteUrl;
                expect(app.utils.buildUrl(value.url)).toEqual(value.expected);
            });
        });
    });

});

