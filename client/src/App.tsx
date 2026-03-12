import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/useAuth'
import { Layout } from './components/Layout'
import { OnboardingLayout } from './components/OnboardingLayout'
import { TenantLayout } from './components/TenantLayout'
import { HomePage } from './pages/HomePage'
import { AccountPage } from './pages/AccountPage'
import { AccountSettingsPage } from './pages/AccountSettingsPage'
import { ChangeEmailPage } from './pages/ChangeEmailPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { EditProfilePage } from './pages/EditProfilePage'
import { LegalPage } from './pages/LegalPage'
import { PaymentMethodPage } from './pages/PaymentMethodPage'
import { PaymentHistoryPage } from './pages/PaymentHistoryPage'
import { SupportPage } from './pages/SupportPage'
import { TenantsPage } from './pages/TenantsPage'
import { WelcomePage } from './pages/WelcomePage'
import { RoleSelectionPage } from './pages/RoleSelectionPage'
import { RentalNeedsPage } from './pages/RentalNeedsPage'
import { ProfileCreationPage } from './pages/ProfileCreationPage'
import { MessagingPage } from './pages/MessagingPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SignupPage } from './pages/SignupPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { VerifyEmailSuccessPage } from './pages/VerifyEmailSuccessPage'
import { YourMatchesPage } from './pages/YourMatchesPage'
import { LandlordMatchPage } from './pages/LandlordMatchPage'
import { LeasePreferencesPage } from './pages/LeasePreferencesPage'
import { TenantQuestionnairePage } from './pages/TenantQuestionnairePage'
import { CompatibilitySurveyPage } from './pages/CompatibilitySurveyPage'
import { ApplicationsPage } from './pages/ApplicationsPage'
import { ApplicationDetailsPage } from './pages/ApplicationDetailsPage'
import { ReviewSubmittedPage } from './pages/ReviewSubmittedPage'
import { UniversalApplicationPage } from './pages/UniversalApplicationPage'
import { ApplicationFormPage } from './pages/ApplicationFormPage'
import { PropertyDetailsPage } from './pages/PropertyDetailsPage'
import { LandlordProfilePreviewPage } from './pages/LandlordProfilePreviewPage'
import { LandlordPropertyDetailsPage } from './pages/LandlordPropertyDetailsPage'
import { PropertiesPage } from './pages/PropertiesPage'
import { PropertyPublishedPage } from './pages/PropertyPublishedPage'
import { LandlordTenantProfilePage } from './pages/LandlordTenantProfilePage'
import { AddPropertyIntroPage } from './pages/AddPropertyIntroPage'
import { AddPropertyBasicInfoPage } from './pages/AddPropertyBasicInfoPage'
import { AddPropertyCommunityPage } from './pages/AddPropertyCommunityPage'
import { AddPropertyAmenitiesPage } from './pages/AddPropertyAmenitiesPage'
import { AddPropertyPhotosPage } from './pages/AddPropertyPhotosPage'
import { AddPropertyPreviewPage } from './pages/AddPropertyPreviewPage'
import { AboutPage } from './pages/AboutPage'
import { PublicLegalPage } from './pages/PublicLegalPage'
import { PublicSupportPage } from './pages/PublicSupportPage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={user ? <TenantLayout /> : <Layout />}>
        <Route index element={user ? <HomePage /> : <WelcomePage />} />
        <Route path="notifications" element={user ? <NotificationsPage /> : <Navigate to="/login" replace />} />
        <Route path="matches" element={user ? <YourMatchesPage /> : <Navigate to="/login" replace />} />
        <Route path="matches/tenant/:id" element={user ? <LandlordTenantProfilePage /> : <Navigate to="/login" replace />} />
        <Route path="applications" element={user ? <ApplicationsPage /> : <Navigate to="/login" replace />} />
        <Route path="applications/apply" element={<UniversalApplicationPage />} />
        <Route path="applications/apply/form" element={user ? <ApplicationFormPage /> : <Navigate to="/login" replace />} />
        <Route path="property/:id" element={user ? <PropertyDetailsPage /> : <Navigate to="/login" replace />} />
        <Route path="properties" element={user ? <PropertiesPage /> : <Navigate to="/login" replace />} />
        <Route path="properties/:id" element={user ? <LandlordPropertyDetailsPage /> : <Navigate to="/login" replace />} />
        <Route path="properties/published" element={user ? <PropertyPublishedPage /> : <Navigate to="/login" replace />} />
        <Route path="messages" element={user ? <MessagingPage /> : <Navigate to="/login" replace />} />
        <Route path="account" element={user ? <AccountPage /> : <Navigate to="/login" replace />} />
        <Route path="account/tenants" element={user ? <TenantsPage /> : <Navigate to="/login" replace />} />
        <Route path="account/application/:id" element={user ? <ApplicationDetailsPage /> : <Navigate to="/login" replace />} />
        <Route path="account/application/:id/review-submitted" element={user ? <ReviewSubmittedPage /> : <Navigate to="/login" replace />} />
        <Route path="account/edit" element={user ? <EditProfilePage /> : <Navigate to="/login" replace />} />
        <Route path="account/profile-preview" element={user ? <LandlordProfilePreviewPage /> : <Navigate to="/login" replace />} />
        <Route path="account/settings" element={user ? <AccountSettingsPage /> : <Navigate to="/login" replace />} />
        <Route path="account/settings/support" element={user ? <SupportPage /> : <Navigate to="/login" replace />} />
        <Route path="account/settings/legal" element={user ? <Navigate to="/account/settings/legal/terms" replace /> : <Navigate to="/login" replace />} />
        <Route path="account/settings/legal/:tab" element={user ? <LegalPage /> : <Navigate to="/login" replace />} />
        <Route path="account/settings/payment-method" element={user ? <PaymentMethodPage /> : <Navigate to="/login" replace />} />
        <Route path="account/settings/payment-history" element={user ? <PaymentHistoryPage /> : <Navigate to="/login" replace />} />
        <Route path="account/settings/change-email" element={user ? <ChangeEmailPage /> : <Navigate to="/login" replace />} />
        <Route path="account/settings/change-password" element={user ? <ChangePasswordPage /> : <Navigate to="/login" replace />} />
        <Route path="survey" element={user ? <Navigate to="/onboarding/survey" replace /> : <Navigate to="/login" replace />} />
        <Route path="survey/intro" element={user ? <Navigate to="/onboarding/survey/intro" replace /> : <Navigate to="/login" replace />} />
      </Route>
      <Route path="/welcome" element={<Navigate to="/" replace />} />
      <Route path="/onboarding" element={user ? <OnboardingLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<RoleSelectionPage />} />
        <Route path="role" element={<RoleSelectionPage />} />
        <Route path="rental-needs" element={<RentalNeedsPage />} />
        <Route path="lease-preferences" element={<LeasePreferencesPage />} />
        <Route path="tenant-questionnaire" element={<TenantQuestionnairePage />} />
        <Route path="profile" element={<ProfileCreationPage />} />
        <Route path="survey" element={<CompatibilitySurveyPage />} />
        <Route path="survey/intro" element={<LandlordMatchPage />} />
        <Route path="property/intro" element={<AddPropertyIntroPage />} />
        <Route path="property/basic-info" element={<AddPropertyBasicInfoPage />} />
        <Route path="property/community" element={<AddPropertyCommunityPage />} />
        <Route path="property/amenities" element={<AddPropertyAmenitiesPage />} />
        <Route path="property/photos" element={<AddPropertyPhotosPage />} />
        <Route path="property/preview" element={<AddPropertyPreviewPage />} />
      </Route>
      <Route path="/login" element={<Layout />}>
        <Route index element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
      </Route>
      <Route path="/reset-password" element={<Layout />}>
        <Route index element={<ResetPasswordPage />} />
      </Route>
      <Route path="/signup" element={<Layout />}>
        <Route index element={user ? <Navigate to="/" replace /> : <SignupPage />} />
        <Route path="verify" element={<VerifyEmailPage />} />
        <Route path="verified" element={<VerifyEmailSuccessPage />} />
      </Route>
      <Route path="/about" element={<Layout />}>
        <Route index element={<AboutPage />} />
      </Route>
      <Route path="/privacy" element={<Layout />}>
        <Route index element={<PublicLegalPage tab="privacy" />} />
      </Route>
      <Route path="/terms" element={<Layout />}>
        <Route index element={<PublicLegalPage tab="terms" />} />
      </Route>
      <Route path="/support" element={<Layout />}>
        <Route index element={<PublicSupportPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
