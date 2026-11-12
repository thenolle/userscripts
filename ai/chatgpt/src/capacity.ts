export const chatgptDefault = (plan: string | null, feature: string): number | null => {
	if (!plan || feature !== 'file_upload') return null
	return plan.toLowerCase() === 'free' ? 3 : 80
}