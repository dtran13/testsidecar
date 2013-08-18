describe("Validation", function() {

    var validation = SUGAR.App.validation,
        Bean = SUGAR.App.Bean;

    describe("'maxLength' validator", function() {

        var field = { len: 5 }; // field metadata

        it("should be able to validate a long string value", function() {

            var result = validation.validators.maxLength(field, "some value");
            expect(result).toBeDefined();
        });

        it("should be able to validate a null or undefined value", function() {
            var result = validation.validators.maxLength(field, null);
            expect(result).toBeUndefined();

            result = validation.validators.maxLength(field, undefined);
            expect(result).toBeUndefined();
        });

        it("should be able to validate a short string value", function() {
            var result = validation.validators.maxLength(field, "foo");
            expect(result).toBeUndefined();

            result = validation.validators.maxLength(field, "12345");
            expect(result).toBeUndefined();
        });

        it("should be able to validate a small numeric value", function() {
            var result = validation.validators.maxLength(field, 100);
            expect(result).toBeUndefined();
        });

        it("should be able to validate a large numeric value", function() {
            var result = validation.validators.maxLength(field, 100000);
            expect(result).toBeDefined();
        });
    });

    describe("number validator", function() {

        var result,
            defaultField = { },
            floatField = { len: 5, type: 'float' },
            intField = { len: 5, type: 'int' },
            currencyField = { type: 'currency' };

        it("should be able to validate numeric value", function() {
            result = validation.validators.number(defaultField, "test");
            expect(result).toBeUndefined();

            result = validation.validators.number(floatField, "foo");
            expect(result).toBeTruthy();
            result = validation.validators.number(floatField, "");
            expect(result).toBeTruthy();
            result = validation.validators.number(floatField, " ");
            expect(result).toBeTruthy();
            result = validation.validators.number(floatField, true);
            expect(result).toBeTruthy();
            result = validation.validators.number(floatField, false);
            expect(result).toBeTruthy();
            result = validation.validators.number(floatField, "123.00");
            expect(result).toBeUndefined();

            result = validation.validators.number(currencyField, "foo");
            expect(result).toBeTruthy();
            result = validation.validators.number(currencyField, "123.00");
            expect(result).toBeUndefined();

            result = validation.validators.number(intField, "foo");
            expect(result).toBeTruthy();
            result = validation.validators.number(intField, "123");
            expect(result).toBeUndefined();
        });
    });

    describe("min max validators", function(){
        var intField = {
                type:'int',
                validation: {
                    max: 10,
                    min: 1
                }
            },
            intField2 = {
                type:'int',
                max: 10,
                min: 0  // this is a corner case; zero gave a lot of trouble in various "if" statements
            };

        it("should be able to validate max int value", function() {
            var result = validation.validators.maxValue(intField, 5);
            expect(result).toBeUndefined();
            result = validation.validators.maxValue(intField2, 5);
            expect(result).toBeUndefined();

            result = validation.validators.maxValue(intField, 11);
            expect(result).toEqual(10);
            result = validation.validators.maxValue(intField2, 11);
            expect(result).toEqual(10);
        });

        it("should be able to validate equal max int value", function() {
            var result = validation.validators.maxValue(intField, 10);
            expect(result).toBeUndefined();
        });

        it("should be able to validate min int value", function() {
            var result = validation.validators.minValue(intField, 5);
            expect(result).toBeUndefined();

            result = validation.validators.minValue(intField, 0);
            expect(result).toEqual(1);
        });

        it("should be able to validate equal min int value", function() {
            var result = validation.validators.minValue(intField, 1);
            expect(result).toBeUndefined();
        });
    });
    describe("'minLength' validator", function() {
        var field = {minlen: 3}; // TODO: Update this to the proper property, using minlen for now

        it("should return the minimum length if the string does not validate", function() {
            var result = validation.validators.minLength(field, ".");
            expect(result).toEqual(3);
        });

        it("should be able to validate a long string value", function() {
            var result = validation.validators.minLength(field, "some value");
            expect(result).toBeUndefined();
        });

        it("should be able to validate a null or undefined value", function() {
            var result = validation.validators.minLength(field);
            expect(result).toBeDefined();
        });

        it("should be able to validate a short string value", function() {
            var result = validation.validators.minLength(field, "hi");
            expect(result).toBeDefined();
        });

        it("should be able to validate a just short enough string value", function() {
            var result = validation.validators.minLength(field, "hit");
            expect(result).toBeUndefined();
        });

        it("should be able to validate a small numeric value", function() {
            var result = validation.validators.minLength(field, 10);
            expect(result).toBeDefined();
        });

        it("should be able to validate a large numeric value", function() {
            var result = validation.validators.minLength(field, 19280);
            expect(result).toBeUndefined();
        });
    });

    // TODO: Temporarily disabled
    xdescribe("'url' validator", function() {
        var field = {type: "url"},
            v = validation.validators.url;

        it("should be able to validate a valid url", function() {
            expect(v(field, "http://www.google.com")).toBeUndefined();
            expect(v(field, "http://docs.google.com")).toBeUndefined();

            expect(v(field, "http://example.com")).toBeUndefined();
            expect(v(field, "https://example.com")).toBeUndefined();

            expect(v(field, "http://example.com/sugar")).toBeUndefined();
            expect(v(field, "https://example.com/sugar")).toBeUndefined();

            expect(v(field, "http://example.com:8888")).toBeUndefined();
            expect(v(field, "http://example.com:8888/sugar")).toBeUndefined();

            expect(v(field, "http://192.168.129.107/sugar")).toBeUndefined();
            expect(v(field, "https://192.168.129.107/sugar")).toBeUndefined();

            expect(v(field, "http://192.168.129.107:8888")).toBeUndefined();
            expect(v(field, "http://192.168.129.107:8888/sugar")).toBeUndefined();

            expect(v(field, "http://127.0.0.1/sugar")).toBeUndefined();
            expect(v(field, "https://127.0.0.1/sugar")).toBeUndefined();

            expect(v(field, "http://127.0.0.1:8888")).toBeUndefined();
            expect(v(field, "http://127.0.0.1:8888/sugar")).toBeUndefined();
        });

        it("should be able to invalidate an invalid url", function() {
            expect(v(field, "test.google.com")).toBeTruthy();
            expect(v(field, "http://localhost")).toBeTruthy();
            expect(v(field, "http://localhost:8888")).toBeTruthy();
            expect(v(field, "http://localhost/sugar")).toBeTruthy();
            expect(v(field, "http://localhost:8888/sugar")).toBeTruthy();
        });
    });

    describe("'datetime' validator", function(){
        var datefield = {type: "date"}, appUserDatePrefStub, v,
            datetimefield = {type: "datetimecombo"};

        v = validation.validators.datetime;

        beforeEach(function() {
            appUserDatePrefStub = sinon.stub(SUGAR.App.user, 
                'getPreference', function() { return 'm-d-Y'; });
        });
        afterEach(function() {
            appUserDatePrefStub.restore();
        });

        it("should be able to validate a date", function(){
            expect(v(datefield,"3/24/1983")).toBeUndefined();
            expect(v(datefield,"1/1/1")).toBeUndefined();
            expect(v(datefield,"3/24/abc")).toEqual("3/24/abc");
            expect(v(datefield,"90/99/2012")).toEqual("90/99/2012");
            expect(v(datefield,"")).toEqual("");
            expect(v(datefield,"5/20/3000")).toBeUndefined();
            expect(v(datefield,"11-11-1111")).toBeUndefined();
            expect(v(datefield,"11.11.1111")).toBeUndefined();
        });

        it("should consider year parts with 3 digits invalid", function(){
            expect(v(datefield,"3/24/100")).toEqual("3/24/100");
            expect(v(datefield,"3/24/010")).toEqual("3/24/010");
            expect(v(datefield,"9/9/999")).toEqual("9/9/999");
            expect(v(datefield,"9.9.999")).toEqual("9.9.999");
            expect(v(datefield,"9-9-999")).toEqual("9-9-999");
            expect(v(datefield,"999/9/9")).toEqual("999/9/9");
            expect(v(datefield,"9/999/9")).toEqual("9/999/9");
        });

        it("should consider year parts with greater than 4 digits invalid", function(){
            expect(v(datefield,"3/24/10000")).toEqual("3/24/10000");
            expect(v(datefield,"3/24/01000")).toEqual("3/24/01000");
            expect(v(datefield,"9/9/99999")).toEqual("9/9/99999");
            expect(v(datefield,"9.9.99999")).toEqual("9.9.99999");
            expect(v(datefield,"9-9-99999")).toEqual("9-9-99999");
            expect(v(datefield,"99999/9/9")).toEqual("99999/9/9");
            expect(v(datefield,"9/99999/9")).toEqual("9/99999/9");
            expect(v(datefield,"3/24/9007199254740992")).toEqual("3/24/9007199254740992");
            expect(v(datefield,"3/24/9007199254740993")).toEqual("3/24/9007199254740993");
        });

        it("should reject if back to back separators", function(){
            expect(v(datefield,"11//11/2013")).toEqual("11//11/2013");
            expect(v(datefield,"11/11//2013")).toEqual("11/11//2013");
            expect(v(datefield,"11/11//2013")).toEqual("11/11//2013");
        });
        it("should reject invalid days and months when not an 'server ISO format' date", function(){
            expect(v(datefield,"11/32/2013")).toEqual("11/32/2013");
            expect(v(datefield,"13/11/2013")).toEqual("13/11/2013");
            expect(v(datefield,"00/11/2013")).toEqual("00/11/2013");
            expect(v(datefield,"11/00/2013")).toEqual("11/00/2013");
            expect(v(datefield,"-1/11/2013")).toEqual("-1/11/2013");
            expect(v(datefield,"11/-1/2013")).toEqual("11/-1/2013");
        });
        it("should be able to validate a datetime", function(){
            expect(v(datetimefield,"1983-03-24 12:15:26")).toBeUndefined();
            expect(v(datetimefield,"1111-11-11 00:00:00")).toBeUndefined();
            expect(v(datetimefield,"99/99/1000 78:00:00")).toEqual("99/99/1000 78:00:00");
            expect(v(datetimefield,"99-99-1000 78:00:00")).toEqual("99-99-1000 78:00:00");
            expect(v(datetimefield,"3000-05-20 23:59:59")).toBeUndefined();
            expect(v(datetimefield,"2012-10-09T10:15:34Z")).toBeUndefined();
            expect(v(datetimefield,"2012-10-09T10:AB:34Z")).toEqual("2012-10-09T10:AB:34Z");
            expect(v(datetimefield,"3000-10-09T10:15:34+00:00")).toBeUndefined();
            expect(v(datetimefield,"3000-99-09T70:15:34Z")).toEqual("3000-99-09T70:15:34Z");
            expect(v(datetimefield,"2012-10-05T15:56:00+00:00")).toBeUndefined();
        });
        it("should reject ISO format dates with year with leading zero", function() {
            expect(v(datetimefield,"0201-01-31T08:00:00.000Z")).toEqual("0201-01-31T08:00:00.000Z");
            expect(v(datetimefield,"0100-01-31T08:00:00.000Z")).toEqual("0100-01-31T08:00:00.000Z");
            expect(v(datetimefield,"0999-01-31T08:00:00.000Z")).toEqual("0999-01-31T08:00:00.000Z");
            expect(v(datetimefield,"1000-01-31T08:00:00.000Z")).toBeUndefined();
        });
    });

    describe("'email' validator", function() {
        var result,
            field = {type: "email"};

        it("should be able to validate a valid email", function() {
            result = validation.validators.email(field, [{email_address: "my.name@name.com"}, {email_address: "HELLO@WORLD.NET"}, {email_address: "asdf@ASDF.xyz"}]);
            expect(result).toBeUndefined();

            result = validation.validators.email(field, [{email_address: "MyName@name.com"}]);
            expect(result).toBeUndefined();

            result = validation.validators.email(field, [{email_address: "foo+-bar@name-baz.com"}]);
            expect(result).toBeUndefined();

            result = validation.validators.email(field, [{email_address: "generic@generic.domain.net"}, {email_address: "test.email@test.google.com"}]);
            expect(result).toBeUndefined();
        });

        it("should be able to invalidate invalid emails", function() {
            result = validation.validators.email(field, [{email_address: "email@.something.something.com"}]);
            expect(result).toEqual(["email@.something.something.com"]);

            result = validation.validators.email(field, [{email_address: ""}]);
            expect(result).toEqual([""]);

            result = validation.validators.email(field, [{email_address: "My Name"}]);
            expect(result).toEqual(["My Name"]);

            result = validation.validators.email(field, [{email_address: "MAIL@something.something.com"}, {email_address: "email@.something.something.com"}, {email_address: "^%$#!.@blah.com"}]);
            expect(result).toEqual(["email@.something.something.com", "^%$#!.@blah.com"]);

            result = validation.validators.email(field, [{email_address: "MAIL@something.something.com"}, {email_address: "emai@ABC@something.something.com"}]);
            expect(result).toEqual(["emai@ABC@something.something.com"]);
        });

    });

    describe("'primaryEmail' validator", function() {
        var result,
            field = {type: "email"};

        it("should be able to validate that there is a primary_address set", function() {
            result = validation.validators.primaryEmail(field, []);
            expect(result).toBeUndefined();

            result = validation.validators.primaryEmail(field, [{email_address: "my.name@name.com"}, {email_address: "HELLO@WORLD.NET", primary_address: "1"}, {email_address: "asdf@ASDF.xyz"}]);
            expect(result).toBeUndefined();

            result = validation.validators.primaryEmail(field, [{email_address: "generic@generic.domain.net", primary_address: "0"}, {email_address: "test.email@test.google.com", primary_address: "1"}]);
            expect(result).toBeUndefined();
        });

        it("should be able to invalidate that there is a primary_address set", function() {
            result = validation.validators.primaryEmail(field, [{email_address: "MyName@name.com", primary_address: "0"}]);
            expect(result).toBeTruthy();

            result = validation.validators.primaryEmail(field, [{email_address: "foo+-bar@name-baz.com"}]);
            expect(result).toBeTruthy();
        });

    });

    describe("'duplicateEmail' validator", function() {
        var result,
            field = {type: "email"};

        it("should be able to validate there is no duplicate email address", function() {
            result = validation.validators.duplicateEmail(field, [{email_address: "my.name@name.com"}, {email_address: "HELLO@WORLD.NET"}, {email_address: "asdf@ASDF.xyz"}]);
            expect(result).toBeUndefined();

            result = validation.validators.duplicateEmail(field, [{email_address: "MyName@name.com"}]);
            expect(result).toBeUndefined();
        });

        it("should be able to invalidate there is no duplicate email address", function() {
            result = validation.validators.duplicateEmail(field, [{email_address: "asdf@ASDF.xyz"}, {email_address: "HELLO@WORLD.NET"}, {email_address: "asdf@ASDF.xyz"}]);
            expect(result).toEqual(["asdf@ASDF.xyz"]);

            result = validation.validators.duplicateEmail(field, [{email_address: "my.name@name.com", primary_address: "0"}, {email_address: "my.name@name.com", primary_address: "1"}]);
            expect(result).toEqual(["my.name@name.com"]);
        });

    });

    describe("'required' validator", function() {

        var rv = validation.requiredValidator,
            field = { required: true }; // field metadata

        it("should be able to validate an empty string field set on a bean with a field already set", function() {
            var bean = new Bean({ name: "foo" }),
                result = rv(field, "name", bean, "");
            expect(result).toBeTruthy();

            result = rv(field, "name", bean, undefined);
            expect(result).toBeFalsy();

            result = rv(field, "name", bean, null);
            expect(result).toBeTruthy();
        });

        it("should be able to validate an empty string field set on a bean with unset field", function() {
            var bean = new Bean(),
                result = rv(field, "name", bean, "");
            expect(result).toBeTruthy();

            result = rv(field, "name", bean, undefined);
            expect(result).toBeTruthy();

            result = rv(field, "name", bean, null);
            expect(result).toBeTruthy();
        });

        it("should be able to validate a non-empty string field set on a bean with unset field", function() {
            var bean = new Bean(),
                result = rv(field, "name", bean, "bar");
            expect(result).toBeFalsy();
        });

        it("should be able to validate a non-empty string field set on a bean with unset field", function() {
            var bean = new Bean(),
                result = rv(field, "name", bean, "bar");
            expect(result).toBeFalsy();
        });

        it("should be able to validate an integer field", function() {
            var bean = new Bean({ x: 0 }),
                result = rv(field, "x", bean, 0);
            expect(result).toBeFalsy();

            bean = new Bean({ x: 0 });
            result = rv(field, "x", bean, 1);
            expect(result).toBeFalsy();

            bean = new Bean({ x: 1 });
            result = rv(field, "x", bean, 0);
            expect(result).toBeFalsy();

            bean = new Bean();
            result = rv(field, "x", bean, 0);
            expect(result).toBeFalsy();

        });

        it("should be able to validate array field", function() {
            var bean = new Bean({ x: ['a'] }),
                result = rv(field, "x", bean, ['b']);
            expect(result).toBeFalsy();

            bean = new Bean({ x: ['a'] });
            result = rv(field, "x", bean, []);
            expect(result).toBeTruthy();

            bean = new Bean();
            result = rv(field, "x", bean, []);
            expect(result).toBeTruthy();

            bean = new Bean({ x: [] });
            result = rv(field, "x", bean, ['a']);
            expect(result).toBeFalsy();

        });

        it("should skip validation if a field is not required", function() {
            var bean = new Bean(),
                result = rv({required: false}, "name", bean, "");
            expect(result).toBeFalsy();

            result = rv({}, "name", bean, "");
            expect(result).toBeFalsy();

            result = rv({}, "name", bean, 0);
            expect(result).toBeFalsy();

            result = rv({}, "name", bean, []);
            expect(result).toBeFalsy();
        });
    });
});
