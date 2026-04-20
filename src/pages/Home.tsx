import { Link } from '@tanstack/react-router'

function Home() {
  return (
    <div>
      <h1>Home</h1>
      <Link to="/new">+ New Transaction</Link>
    </div>
  )
}

export default Home
