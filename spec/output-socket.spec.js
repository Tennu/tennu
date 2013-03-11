var OutputSocket = require('./../lib/output-socket');
var nick = 'testbot';

describe('IRC Output Sockets', function () {
    var socket, os;

    beforeEach(function () {
        socket = { raw: jasmine.createSpy("raw") };
        os = new OutputSocket(socket, nick);
    });

    it('can send private messages', function () {
        os.say('#test', 'Hi');
        expect(socket.raw).toHaveBeenCalledWith("PRIVMSG #test :Hi");
    });

    it('can part without a reason', function () {
        os.part('#test');
        expect(socket.raw).toHaveBeenCalledWith("PART #test");
    });

    it('can part with a reason', function () {
        os.part('#test', 'the reason');
        expect(socket.raw).toHaveBeenCalledWith("PART #test :the reason");
    });

    it('can quit without a reason', function () {
        os.quit();
        expect(socket.raw).toHaveBeenCalledWith("QUIT");
    });

    it('can quit with a reason', function () {
        os.quit('the reason');
        expect(socket.raw).toHaveBeenCalledWith("QUIT :the reason");
    });

    // TODO: Write more tests for other methods. The tests that are here
    // are here because there were failing tests in the integration suite
    // and I needed to isolate them.
});