import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { ToastProvider } from '@/context/ToastContext';
import { BasketProvider } from '@/context/BasketContext';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { Navbar, BottomTabBar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FullPageLoader } from '@/components/ui';
import { HomePage } from '@/pages/HomePage';
import { AcceptPage } from '@/pages/AcceptPage';
import { PricesPage } from '@/pages/PricesPage';
import { AboutPage } from '@/pages/AboutPage';
import { FaqPage } from '@/pages/FaqPage';
import { ContactPage } from '@/pages/ContactPage';
import { PrivacyPage, TermsPage } from '@/pages/LegalPages';
import { SignupPage } from '@/pages/SignupPage';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminPage } from '@/pages/AdminPage';
import { AdminOverview } from '@/pages/admin/AdminOverview';
import { AdminPickups } from '@/pages/admin/AdminPickups';
import { AdminGrading } from '@/pages/admin/AdminGrading';
import { AdminRates } from '@/pages/admin/AdminRates';
import { AdminStock } from '@/pages/admin/AdminStock';
import { AdminHandover } from '@/pages/admin/AdminHandover';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminZones } from '@/pages/admin/AdminZones';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminComponents } from '@/pages/admin/AdminComponents';
import { AdminComponentRequests } from '@/pages/admin/AdminComponentRequests';
import { AddItemsPage } from '@/pages/AddItemsPage';
import { ComponentsPage } from '@/pages/ComponentsPage';
import { MyRequestsPage } from '@/pages/MyRequestsPage';
import { MiniProjectsPage } from '@/pages/MiniProjectsPage';

function AppRoutes() {
  const { path } = useRouter();
  const { loading } = useAuth();
  const guard = useRouteGuard();

  if (loading) return <FullPageLoader />;

  // Auth pages (no navbar/footer)
  if (path === '/login' || path === '/signup') {
    if (path === '/login') return <LoginPage />;
    return <SignupPage />;
  }

  // Check route guard for protected routes
  if (guard.loading) return <FullPageLoader />;
  if (!guard.authorized) return <FullPageLoader />;

  // Route matching
  const renderPage = () => {
    if (path === '/') return <HomePage />;
    if (path === '/accept') return <AcceptPage />;
    if (path === '/prices') return <PricesPage />;
    if (path === '/about') return <AboutPage />;
    if (path === '/faq') return <FaqPage />;
    if (path === '/contact') return <ContactPage />;
    if (path === '/privacy') return <PrivacyPage />;
    if (path === '/terms') return <TermsPage />;
    if (path === '/dashboard') return <DashboardPage />;
    if (path === '/profile') return <DashboardPage />;
    if (path === '/add-items') return <AddItemsPage />;
    if (path === '/book' || path === '/pickups' || path === '/messages' || path === '/wallet') return <DashboardPage />;
    if (path === '/admin') return <AdminPage />;
    if (path === '/admin/overview') return <AdminOverview />;
    if (path === '/admin/pickups') return <AdminPickups />;
    if (path === '/admin/grading') return <AdminGrading />;
    if (path === '/admin/rates') return <AdminRates />;
    if (path === '/admin/stock') return <AdminStock />;
    if (path === '/admin/handover') return <AdminHandover />;
    if (path === '/admin/users') return <AdminUsers />;
    if (path === '/admin/zones') return <AdminZones />;
    if (path === '/admin/orders') return <AdminOrders />;
    if (path === '/admin/components') return <AdminComponents />;
    if (path === '/admin/component-requests') return <AdminComponentRequests />;
    if (path === '/components') return <ComponentsPage />;
    if (path === '/my-requests') return <MyRequestsPage />;
    if (path === '/projects') return <MiniProjectsPage />;
    if (path.startsWith('/admin')) return <AdminPage />;
    return <HomePage />;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-16 lg:pb-0">{renderPage()}</main>
      <Footer />
      <BottomTabBar />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <ToastProvider>
          <BasketProvider>
            <AppRoutes />
          </BasketProvider>
        </ToastProvider>
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;
