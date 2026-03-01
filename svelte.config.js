import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			precompress: false,
		}),
		alias: {
			'$components': 'src/components',
			'$components/*': 'src/components/*'
		}
	}
};

export default config;
