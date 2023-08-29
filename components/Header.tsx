import Link from 'next/link';

const Header = () => (
  <header>
    <nav>
      <Link href="/" className="subtle-animation">Home</Link>
      <Link href="/career"className="subtle-animation">Career</Link>
    </nav>
  </header>
);

export default Header;

