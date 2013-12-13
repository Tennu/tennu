/*xdescribe('ChunkedMessageParsers', function () {
    var mp, cmp, rcvr;

    beforeEach(function () {
        rcvr = {_id: id()};
        mp = new MessageParser(rcvr);
        cmp = new ChunkedMessageParser(mp);
    });

    it('relay unknown messages as a message handler', function () {
        var msg, done;

        runs(function () {
            cmp.on('unknown', function (m) {
                done = true;
                msg = m;
            });

            mp.parse(':server.network.net UNKNOWN testbot :An unknown message');
        });

        waitsFor(function () { return done; }, "unkown message received");

        runs(function () {
            expect(msg.name).toBe("unknown");
            expect(msg.receiver).toBe(rcvr);
            expect(msg.args[0]).toBe('testbot');
        });
    });

    it('handles MOTD chunking', function () {
        var msg, m;
        var prefix = ":irc.testnet.net ";

        runs(function () {
            cmp.on('motd', function (motd) {
                done = true;
                msg = m;
            });

            mp.parse(prefix + "372 testbot :The first message.");
            mp.parse(prefix + "372 testbot :The second message.");
            mp.parse(prefix + "376 testbot :End of /MOTD command.");
        });

        waitsFor(function () { return done; }, "motd message received");

        runs(function () {
            expect(msg.name).toBe("motd");
            expect(msg.receiver).toBe(rcvr);
            expect(msg.args).toEqual([
                "372", "testbot", "The first message.",
                "372", "testbot", "The second message.",
                "376", "testbot", "End of /MOTD command."
                ]);
            expect(msg.motd).toEqual([
                "The first message.",
                "The second message."
                ]);
        });
    });
});*/