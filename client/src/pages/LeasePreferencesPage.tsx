import { EditLeasePreferencesPage } from './EditLeasePreferencesPage'

export function LeasePreferencesPage() {
  return (
    <EditLeasePreferencesPage
      backPath="/matches"
      cancelPath="/tenant-questionnaire"
      nextPath="/tenant-questionnaire"
      backLabel="Back"
      cancelLabel="Skip"
      title="Set your lease preferences"
      subtitle="Share your move date, budget, and preferences so we can match you with the right properties."
      framed
    />
  )
}
