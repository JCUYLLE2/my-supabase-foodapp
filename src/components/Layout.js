// src/components/Layout.js
import Topbar from './Topbar';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <>
      <Topbar />
      <main>{children}</main>
      <Navbar />
    </>
  );
}
