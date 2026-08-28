/* Public Supabase settings. The publishable key is safe to expose in a browser. */
const supabaseClient = window.supabase.createClient(
	'https://qlvlztcpvwvepberahgy.supabase.co',
	'sb_publishable_gU2Jxr7cayZJvpNxxiCjag_e7pCp2nl'
);

window.imageGame = {
	client: supabaseClient,
	cache: { profiles: {}, scores: {}, finders: {}, completed: {}, firstGuesses: {}, requests: {} },
	usernameEmail(username) { return `${username.toLowerCase().replace(/[^a-z0-9._-]/g, '')}@image-game.local`; },
	async load() {
		const [{ data: profiles }, { data: scores }, { data: finds }, { data: completed }, { data: guesses }, { data: requests }] = await Promise.all([
			supabaseClient.from('image_game_profiles').select('username, approved, role'),
			supabaseClient.from('image_game_scores').select('username, points'),
			supabaseClient.from('image_game_finds').select('image_id, username, seconds'),
			supabaseClient.from('image_game_completed').select('username, image_id'),
			supabaseClient.from('image_game_first_guesses').select('image_id, username'),
			supabaseClient.from('image_game_approval_requests').select('username, approved')
		]);
		if (profiles) profiles.forEach(row => { this.cache.profiles[row.username] = row; });
		if (scores) scores.forEach(row => { this.cache.scores[row.username] = row.points; });
		if (finds) finds.forEach(row => { (this.cache.finders[row.image_id] ||= []).push({ username: row.username, seconds: row.seconds }); });
		if (completed) completed.forEach(row => { this.cache.completed[`${row.username}:${row.image_id}`] = true; });
		if (guesses) guesses.forEach(row => { this.cache.firstGuesses[row.image_id] = row.username; });
		if (requests) requests.forEach(row => { this.cache.requests[row.username] = row; });
	},
	readAccounts() { return {}; },
	readApprovedUsers() { return Object.fromEntries([...Object.values(this.cache.profiles).filter(row => row.approved), ...Object.values(this.cache.requests).filter(row => row.approved)].map(row => [row.username, true])); },
	readApprovalRequests() { return this.cache.requests; },
	readScores() { return this.cache.scores; },
	readFirstGuesses() { return this.cache.firstGuesses; },
	readImageFinders() { return this.cache.finders; },
	async requestApproval(username) {
		const { error } = await supabaseClient.from('image_game_approval_requests').upsert({ username });
		if (error) throw error;
		this.cache.requests[username] = { username, approved: false };
	},
	async approve(username) {
		const { error } = await supabaseClient.from('image_game_approval_requests').update({ approved: true }).eq('username', username);
		if (error) throw error;
		this.cache.requests[username] = { username, approved: true };
	},
	async submitScore(username, imageId, seconds) {
		const { data, error } = await supabaseClient.rpc('submit_image_game_score', { target_image_id: imageId, solve_seconds: seconds });
		if (error) throw error;
		await this.load();
		return data;
	},
	async setScore(username, points) {
		const { error } = await supabaseClient.rpc('set_image_game_score', { target_username: username, new_points: points });
		if (error) throw error;
		await this.load();
	},
	async deleteUser(username) {
		const { error } = await supabaseClient.from('image_game_profiles').delete().eq('username', username);
		if (error) throw error;
		delete this.cache.profiles[username];
		delete this.cache.scores[username];
	}
};