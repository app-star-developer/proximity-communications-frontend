import { Outlet } from '@tanstack/react-router'

const _protected = () => {
  return (
    <div>
        <Outlet />
    </div>
  )
}

export default _protected