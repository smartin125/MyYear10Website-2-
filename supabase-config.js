/* Public Supabase settings. The publishable key is safe to expose in a browser. */
const supabaseClient = window.supabase.createClient(
	'https://qlvlztcpvwvepberahgy.supabase.co',
	'sb_publishable_gU2Jxr7cayZJvpNxxiCjag_e7pCp2nl'
);

window.imageGame = {
	client: supabaseClient,
	cache: { profiles: {}, profilesById: {}, scores: {}, finders: {}, completed: {}, firstGuesses: {}, requests: {}, approvedUsernames: {} },
	usernameEmail(username) { return `${username.toLowerCase().replace(/[^a-z0-9._-]/g, '')}@image-game.local`; },
	async load() {
		const results = await Promise.all([
			supabaseClient.from('image_game_profiles').select('id, username, approved, role'),
			supabaseClient.from('image_game_scores').select('username, points'),
			supabaseClient.from('image_game_finds').select('image_id, username, seconds'),
			supabaseClient.from('image_game_completed').select('username, image_id'),
			supabaseClient.from('image_game_first_guesses').select('image_id, username'),
			supabaseClient.from('image_game_approval_requests').select('username'),
			supabaseClient.from('image_game_approved_usernames').select('username')
		]);
		const failedQuery = results.find(result => result.error);
		if (failedQuery) throw failedQuery.error;
		const [{ data: profiles }, { data: scores }, { data: finds }, { data: completed }, { data: guesses }, { data: requests }, { data: approvedUsernames }] = results;
		if (profiles) profiles.forEach(row => { this.cache.profiles[row.username] = row; this.cache.profilesById[row.id] = row; });
		if (scores) scores.forEach(row => { this.cache.scores[row.username] = row.points; });
		if (finds) finds.forEach(row => { (this.cache.finders[row.image_id] ||= []).push({ username: row.username, seconds: row.seconds }); });
		if (completed) completed.forEach(row => { this.cache.completed[`${row.username}:${row.image_id}`] = true; });
		if (guesses) guesses.forEach(row => { this.cache.firstGuesses[row.image_id] = row.username; });
		if (requests) requests.forEach(row => { this.cache.requests[row.username] = row; });
		if (approvedUsernames) approvedUsernames.forEach(row => { this.cache.approvedUsernames[row.username] = true; });
	},
	readAccounts() { return {}; },
	readApprovedUsers() { return Object.fromEntries([...Object.values(this.cache.profiles).filter(row => row.approved), ...Object.keys(this.cache.approvedUsernames).map(username => ({ username }))].map(row => [row.username, true])); },
	readApprovalRequests() { return this.cache.requests; },
	readScores() { return this.cache.scores; },
	readFirstGuesses() { return this.cache.firstGuesses; },
	readImageFinders() { return this.cache.finders; },
	async getDailySelection(day, fallbackDate) {
		const { data, error } = await supabaseClient.rpc('get_image_game_selection', { target_day: day, fallback_date: fallbackDate });
		if (error) throw error;
		return data;
	},
	async setDailySelection(day, archiveDate) {
		const { data, error } = await supabaseClient.rpc('set_image_game_selection', { target_day: day, selected_date: archiveDate });
		if (error) throw error;
		return data;
	},
	async requestApproval(username) {
		const { error } = await supabaseClient.from('image_game_approval_requests').upsert({ username });
		if (error) throw error;
		this.cache.requests[username] = { username, approved: false };
	},
	async approve(username) {
		const { error } = await supabaseClient.from('image_game_approved_usernames').upsert({ username });
		if (error) throw error;
		const { error: deleteError } = await supabaseClient.from('image_game_approval_requests').delete().eq('username', username);
		if (deleteError) throw deleteError;
		delete this.cache.requests[username];
		this.cache.approvedUsernames[username] = true;
	},
	async decline(username) {
		const { error } = await supabaseClient.from('image_game_approval_requests').delete().eq('username', username);
		if (error) throw error;
		delete this.cache.requests[username];
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