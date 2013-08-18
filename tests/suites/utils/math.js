describe('Math', function() {
    var app;
    var math;

    beforeEach(function() {
        app = SugarTest.app;
        math = app.math;
    });

    it("should add two numbers accurately", function() {
        var result = math.add(5.000001, 5.000001);
        expect(result).toEqual(10.000002);
        var result = math.add(999999999.000001, 999999999.000001, 6);
        expect(result).toEqual(1999999998.000002);
        // accept strings too
        result = math.add('10', '10', 2);
        expect(result).toEqual(20);
        // should fix JS normal failure (would give 237.64999999999998 ≈ 237.649)
        result = math.add(123.52, 114.13, 3);
        expect(result).toEqual(237.65);
    });

    it("should subtract two numbers accurately", function() {
        var result = math.sub(5.000002, 1.000001);
        expect(result).toEqual(4.000001);
        var result = math.sub(999999999.000002, 999999999.000001, 6);
        expect(result).toEqual(0.000001);
        // accept strings too
        result = math.sub('100', '50', 2);
        expect(result).toEqual(50);
        // should fix JS normal failure (would give 12.149999999999999 ≈ 12.149)
        result = math.sub(12.36, 0.21, 3);
        expect(result).toEqual(12.15);
    });

    it("should multiply two numbers accurately", function() {
        var result = math.mul(5.25, 5.25, 4);
        expect(result).toEqual(27.5625);
        result = math.mul(5.000001, 5.000001, 6)
        expect(result).toEqual(25.00001);
        result = math.mul(1000000.000001, 1000000.000001, 6)
        expect(result).toEqual(1000000000002);
        // 1.9 billion * 1.9 billion, big enough for testing
        result = math.mul(1999999999.000001, 1999999999.000001, 6)
        expect(result).toEqual(3999999996000004000);
        // accept strings too
        result = math.mul('1000', '10', 2);
        expect(result).toEqual(10000);
        // should fix JS normal failure (would give 0.24499999999999997 ≈ 0.24)
        result = math.mul(0.7, 0.35, 2);
        expect(result).toEqual(0.25);
    });

    it("should divide two numbers accurately", function() {
        var result = math.div(10, 10);
        expect(result).toEqual(1);
        result = math.div(10.000001, 10.000001, 6);
        expect(result).toEqual(1);
        result = math.div(10.00001, 2, 6);
        expect(result).toEqual(5.000005);
        result = math.div(999.999999, 333.333333, 6);
        expect(result).toEqual(3);
        result = math.div(999999999.999999, 333333333.333333, 6);
        expect(result).toEqual(3);
        result = math.div(1000, 1.0, 2);
        expect(result).toEqual(1000);
        // accept strings too
        result = math.div('1000', '1', 2);
        expect(result).toEqual(1000);
        // should fix JS normal failure (would give 0.8749999999999999 ≈ 0.87)
        result = math.div(0.70, 0.80, 2);
        expect(result).toEqual(0.88);
    });

    it("should return decimal rounding accurate", function() {
        var result = math.round(10 * 132.32, 2);
        expect(result).toEqual(1323.20);
        result = math.round(999.999998 + 0.000001, 6);
        expect(result).toEqual(999.999999);
        result = math.round(1.0 - 0.02, 2);
        expect(result).toEqual(0.98);
        // should fix JS normal failure (would give 237.64999999999998 ≈ 237.649)
        result = math.round(123.52 + 114.13, 3);
        expect(result).toEqual(237.65);
        result = math.round(40.5, 0);
        expect(result).toEqual(41);
    });
});
