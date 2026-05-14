import { Navigate } from "react-router-dom";
import { getToken } from "../utils/auth";

import AuthLayout from "../layouts/AuthLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";

import LoginPage from "../modules/auth/pages/LoginPage.jsx";
import ForgotPasswordPage from "../modules/auth/pages/ForgotPasswordPage.jsx";
import VerifyOtpPage from "../modules/auth/pages/VerifyOtpPage.jsx";
import ResetPasswordPage from "../modules/auth/pages/ResetPasswordPage.jsx";

import DashboardPage from "../modules/dashboard/pages/DashboardPage.jsx";
import POSPage from "../modules/pos/pages/POSPage.jsx";

import ProductsPage from "../modules/products/pages/ProductsPage.jsx";
import ProductCreatePage from "../modules/products/pages/ProductCreatePage.jsx";
import ProductEditPage from "../modules/products/pages/ProductEditPage.jsx";

import CategoriesPage from "../modules/categories/pages/CategoriesPage.jsx";

import InventoryPage from "../modules/inventory/pages/InventoryPage.jsx";
import InventoryAdjustPage from "../modules/inventory/pages/InventoryAdjustPage.jsx";
import LowStockPage from "../modules/inventory/pages/LowStockPage.jsx";
import ExpiryTrackingPage from "../modules/inventory/pages/ExpiryTrackingPage.jsx";
import InventoryMovementsPage from "../modules/inventory/pages/InventoryMovementsPage.jsx";

import OrdersPage from "../modules/orders/pages/OrdersPage.jsx";
import OrderDetailPage from "../modules/orders/pages/OrderDetailPage.jsx";

import CustomersPage from "../modules/customers/pages/CustomersPage.jsx";
import CustomerFormPage from "../modules/customers/pages/CustomerFormPage.jsx";
import CustomerDetailPage from "../modules/customers/pages/CustomerDetailPage.jsx";

import RidersPage from "../modules/delivery/pages/RidersPage.jsx";
import RiderFormPage from "../modules/delivery/pages/RiderFormPage.jsx";
import DeliveriesPage from "../modules/delivery/pages/DeliveriesPage.jsx";
import DeliveryDetailPage from "../modules/delivery/pages/DeliveryDetailPage.jsx";

import PromotionsPage from "../modules/promotions/pages/PromotionsPage.jsx";
import PromotionFormPage from "../modules/promotions/pages/PromotionFormPage.jsx";
import PromotionDetailPage from "../modules/promotions/pages/PromotionDetailPage.jsx";

import ReportsPage from "../modules/reports/pages/ReportsPage.jsx";

import WhatsAppOrdersPage from "../modules/whatsapp/pages/WhatsAppOrdersPage.jsx";
import WhatsAppOrderCreatePage from "../modules/whatsapp/pages/WhatsAppOrderCreatePage.jsx";
import WhatsAppTemplatesPage from "../modules/whatsapp/pages/WhatsAppTemplatesPage.jsx";

import SettingsPage from "../modules/settings/pages/SettingsPage.jsx";

import UsersPage from "../modules/users/pages/UsersPage.jsx";
import UserFormPage from "../modules/users/pages/UserFormPage.jsx";
import RolesPermissionsPage from "../modules/users/pages/RolesPermissionsPage.jsx";

import ActivityLogsPage from "../modules/audit/pages/ActivityLogsPage.jsx";

import BarcodeLabelsPage from "../modules/printing/pages/BarcodeLabelsPage.jsx";
import ReceiptPrintPage from "../modules/printing/pages/ReceiptPrintPage.jsx";

import WooCommercePage from "../modules/woocommerce/pages/WooCommercePage.jsx";
import WooCommerceSettingsPage from "../modules/woocommerce/pages/WooCommerceSettingsPage.jsx";

function ProtectedRoute({ children }) {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const token = getToken();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export const appRoutes = [
  {
    element: (
      <PublicOnlyRoute>
        <AuthLayout />
      </PublicOnlyRoute>
    ),
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "/verify-otp",
        element: <VerifyOtpPage />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },

      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "pos",
        element: <POSPage />,
      },
{
  path: "pos/scan",
  element: <POSPage />,
},
      {
        path: "products",
        element: <ProductsPage />,
      },
      {
        path: "products/create",
        element: <ProductCreatePage />,
      },
      {
        path: "products/new",
        element: <ProductCreatePage />,
      },
      {
        path: "products/:id/edit",
        element: <ProductEditPage />,
      },

      {
        path: "categories",
        element: <CategoriesPage />,
      },

      {
        path: "inventory",
        element: <InventoryPage />,
      },
      {
        path: "inventory/adjust",
        element: <InventoryAdjustPage />,
      },
      {
        path: "inventory/low-stock",
        element: <LowStockPage />,
      },
      {
        path: "inventory/expiry",
        element: <ExpiryTrackingPage />,
      },
      {
        path: "inventory/movements",
        element: <InventoryMovementsPage />,
      },

      {
        path: "orders",
        element: <OrdersPage />,
      },
      {
        path: "orders/:id",
        element: <OrderDetailPage />,
      },

      {
        path: "customers",
        element: <CustomersPage />,
      },
      {
        path: "customers/new",
        element: <CustomerFormPage />,
      },
      {
        path: "customers/:id",
        element: <CustomerDetailPage />,
      },
      {
        path: "customers/:id/edit",
        element: <CustomerFormPage />,
      },

      {
        path: "delivery/orders",
        element: <DeliveriesPage />,
      },
      {
        path: "delivery/orders/:id",
        element: <DeliveryDetailPage />,
      },
      {
        path: "delivery/riders",
        element: <RidersPage />,
      },
      {
        path: "delivery/riders/new",
        element: <RiderFormPage />,
      },
      {
        path: "delivery/riders/:id/edit",
        element: <RiderFormPage />,
      },

      {
        path: "promotions",
        element: <PromotionsPage />,
      },
      {
        path: "promotions/new",
        element: <PromotionFormPage />,
      },
      {
        path: "promotions/:id",
        element: <PromotionDetailPage />,
      },
      {
        path: "promotions/:id/edit",
        element: <PromotionFormPage />,
      },

      {
        path: "reports",
        element: <ReportsPage />,
      },

      {
        path: "whatsapp/orders",
        element: <WhatsAppOrdersPage />,
      },
      {
        path: "whatsapp/orders/new",
        element: <WhatsAppOrderCreatePage />,
      },
      {
        path: "whatsapp/templates",
        element: <WhatsAppTemplatesPage />,
      },

      {
        path: "printing/barcodes",
        element: <BarcodeLabelsPage />,
      },
      {
        path: "printing/receipt/:orderId",
        element: <ReceiptPrintPage />,
      },

      {
        path: "woocommerce",
        element: <WooCommercePage />,
      },
      {
        path: "woocommerce/settings",
        element: <WooCommerceSettingsPage />,
      },

      {
        path: "settings/woocommerce",
        element: <WooCommerceSettingsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },

      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "users/new",
        element: <UserFormPage />,
      },
      {
        path: "users/:id/edit",
        element: <UserFormPage />,
      },
      {
        path: "roles-permissions",
        element: <RolesPermissionsPage />,
      },

      {
        path: "activity-logs",
        element: <ActivityLogsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
];