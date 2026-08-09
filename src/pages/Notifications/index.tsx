import { useQuery } from "@tanstack/react-query"
import { getProfile } from "@/services/profile"
import { TopBar } from "@/components/layout/TopBar"
import { NotificationsSettings } from "@/components/settings/NotificationsSettings"

export function NotificationsPage() {
  const { data: profile, isLoading, isError, refetch } = useQuery({ queryKey: ["profile"], queryFn: getProfile })
  return (
    <div className="flex-1 flex flex-col items-center w-full pb-8">
      <TopBar title="Notificaciones" showBack />
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>
      ) : isError ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <p className="text-red-500 text-center px-4">Error al cargar el perfil.</p>
          <button onClick={() => refetch()} className="text-blue-500 font-medium">Reintentar</button>
        </div>
      ) : !profile ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No hay datos de perfil.</p>
        </div>
      ) : (
        <div className="w-full mt-4 px-4">
          <NotificationsSettings profile={profile} />
        </div>
      )}
    </div>
  )
}
