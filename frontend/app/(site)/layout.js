import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageEnter from '@/components/motion/PageEnter';

export default function SiteLayout({ children }) {
  return (
    <>
      <Navbar />
      <main id="content"><PageEnter>{children}</PageEnter></main>
      <Footer />
    </>
  );
}
