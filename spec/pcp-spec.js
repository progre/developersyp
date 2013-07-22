var pcp = require('../rootserver/pcp');

describe('pcp', function() {
	it('equals input and output', function() {
		expect(pcp.GID.from_string('000102030405060708090a0b0c0d0e0f').to_s())
			.toEqual('000102030405060708090a0b0c0d0e0f');
	});
});