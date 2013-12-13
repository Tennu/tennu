var EventEmiter = require('../lib/event-emitter.js');

describe("Tennu's event emitter", function () {
    var EE;
    var called;

    beforeEach(function () {
        EE = EventEmiter();
    });

    it("works as an event emitter.", function (done) {
        EE.on('x', function () { done() });
        EE.emit('x');
    });

    it("doesn't throw on non-existent events.", function () {
        expect(EE.emit.bind(EE, 'y')).not.toThrow();
    });

    describe("#then", function () {
        it('takes a function, which it calls after the listener returns.', function (done) {
            EE.on('x', function () {return true;});
            EE.then(function (err, res, emitted, arbitrary) {
                expect(err).toBe(undefined);
                expect(res).toBe(true);
                expect(emitted).toBe('x');
                expect(arbitrary).toBe('arbitrary');
                done();
            });
            EE.emit('x', 'arbitrary');
        });
    });
});