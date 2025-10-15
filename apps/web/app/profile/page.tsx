import dynamic from 'next/dynamic'
const ProfileContent = dynamic(() => import('@/components/profile/ProfileContent'), {
    loading: () => <p>Đang tải...</p>,
})
export default function ProfilePage() {
    return (
        <ProfileContent />
    )
}