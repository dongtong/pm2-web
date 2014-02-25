var Configuration = require(__dirname + "/../../../../server/components/Configuration"),
	sinon = require("sinon"),
	should = require("should");

var createConfig = function(options, argv) {
	var config = new Configuration(options, argv);
	config._logger = {
		info: sinon.stub(),
		warn: sinon.stub(),
		error: sinon.stub(),
		debug: sinon.stub()
	};

	// don't actually want to read configuration files..
	config._loadConfigFiles = function() {
		return {};
	};

	config.afterPropertiesSet();

	return config;
};

module.exports = {
	"Should include localhost by default": function(test) {
		var config = createConfig();
		var hosts = config.get("pm2");

		hosts.length.should.equal(1);
		hosts[0].host.should.equal("localhost");

		test.done();
	},

	"Should not include localhost when host specified": function(test) {
		var config = createConfig({pm2: [{host: "foo"}]});
		var hosts = config.get("pm2");

		hosts.length.should.equal(1);
		hosts[0].host.should.not.equal("localhost");

		test.done();
	},

	"Should parse array of hosts": function(test) {
		var config = createConfig({pm2: {host: ["foo", "bar"]}});
		var hosts = config.get("pm2");

		hosts.length.should.equal(2);
		hosts[0].host.should.equal("foo");
		hosts[1].host.should.equal("bar");

		test.done();
	},

	"Should override ports": function(test) {
		var config = createConfig({pm2: {host: "foo", rpc: 10, events: 11}});
		var hosts = config.get("pm2");

		hosts.length.should.equal(1);
		hosts[0].host.should.equal("foo");
		hosts[0].rpc.should.equal(10);
		hosts[0].events.should.equal(11);

		test.done();
	},

	"Should override ports with arrays": function(test) {
		var config = createConfig({pm2: {host: ["foo", "bar"], rpc: [10, 11], events: [12, 13]}});
		var hosts = config.get("pm2");

		hosts.length.should.equal(2);
		hosts[0].host.should.equal("foo");
		hosts[0].rpc.should.equal(10);
		hosts[0].events.should.equal(12);
		hosts[1].host.should.equal("bar");
		hosts[1].rpc.should.equal(11);
		hosts[1].events.should.equal(13);

		test.done();
	},

	"Should get inspector port, even though it's not in the defaults": function(test) {
		var config = createConfig({pm2: {host: "foo", inspector: 8001}});
		var hosts = config.get("pm2");

		hosts.length.should.equal(1);
		hosts[0].host.should.equal("foo");
		hosts[0].inspector.should.equal(8001);

		test.done();
	},

	"Should survive setting and getting invalid values": function(test) {
		var config = createConfig();

		config.set(null, undefined);
		should(config.get(null)).be.null;

		test.done();
	},

	"Should deep set object properties": function(test) {
		var config = createConfig();

		var target = {};
		var key = "foo:bar:baz";
		var value = "qux";

		config._apply(key, value, target);

		target.foo.bar.baz.should.equal(value);

		test.done();
	},

	"Should return an empty list of hosts": function(test) {
		var config = createConfig();
		config._config.pm2 = null;

		config._normaliseHosts();

		var hosts = config.get("pm2");

		hosts.length.should.equal(0);

		test.done();
	},

	"Should pass command line args with semi colon": function(test) {
		var config = createConfig({}, {
			"pm2:host": "baz"
		});

		var hosts = config.get("pm2");
		hosts.length.should.equal(1);
		hosts[0].host.should.equal("baz");

		test.done();
	},

	"Should pass command line args with full stop": function(test) {
		var config = createConfig({}, {
			"pm2.host": "baz"
		});

		var hosts = config.get("pm2");
		hosts.length.should.equal(1);
		hosts[0].host.should.equal("baz");

		test.done();
	},

	"Should arrayify object": function(test) {
		var config = createConfig();
		var output = config._arrayify({});

		Array.isArray(output).should.be.true;

		test.done();
	},

	"Should apply defaults to object": function(test) {
		var config = createConfig();
		var output = config._defaults({

		}, {
			bool: true,
			string: "string",
			number: 1,
			array: [{}],
			object: {
				foo: "bar"
			}
		});

		output.bool.should.be.true;
		output.string.should.equal("string");
		output.number.should.equal(1);
		output.array.length.should.equal(1);
		output.object.foo.should.equal("bar");

		test.done();
	},

	"Should not apply defaults to object": function(test) {
		var config = createConfig();
		var output = config._defaults({
			bool: false,
			string: "foo",
			number: 2,
			array: [{}, {}],
			object: {
				foo: "baz"
			}
		}, {
			bool: true,
			string: "string",
			number: 1,
			array: [{}],
			object: {
				foo: "bar"
			}
		});

		output.bool.should.be.false;
		output.string.should.equal("foo");
		output.number.should.equal(2);
		output.array.length.should.equal(2);
		output.object.foo.should.equal("baz");

		test.done();
	}
};
