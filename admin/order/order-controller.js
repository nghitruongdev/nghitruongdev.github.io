app.controller('orderCtrl', function ($scope, $utility) {
  const { $data, $serverUrl } = $utility

  $data.fetch($scope, { name: 'orders' })
  $scope.viewDetail = (order) => {
    const url = order._links.orderDetails.href.replace(
      '{?projection}',
      '?projection=withProduct'
    )
    console.log(url)
    $data.fetchOne(url, (resp) => {
      $scope.orderDetails = resp.data._embedded.orderDetails
    })
  }
})
