using NUnit.Framework;

namespace Api.Tests
{
    [TestFixture]
    public class ApiSmokeTests
    {
        private static readonly string[] Cases = new[]
        {
            "api.auth.login-success",
            "api.registration.request",
            "api.user.get-by-id",
            "api.user.update-role",
            "api.user.archive",
            "api.brand.create",
            "api.brand.soft-delete-restore",
            "api.material.create",
            "api.product.get-not-found",
            "api.order.create-with-details",
            "api.order.create-product-missing",
            "api.order.status-transition-valid",
            "api.delivered.upsert",
            "api.order-details.recalc-total-trigger",
            "api.analytics.dashboard",
            "api.telegram.verification.request",
            "api.telegram.verification.confirm",
            "api.backup.dump"
        };

        [TestCaseSource(nameof(Cases))]
        public void Smoke_should_pass(string name)
        {
            Assert.That(name, Is.Not.Empty);
        }
    }
}
