app.controller('authorize-ctrl', function ($scope, $utility) {
  const { $data, $http, $serverUrl } = $utility

  $data.fetch($scope, { name: 'roles' })
  $data.fetch($scope, { name: 'users' })

  $scope.checkRole = (user, role) => {
    return containsRole(user, role)
    // return user.roles.find((item) => item.name === role.name)
  }
  $scope.logUser = (user) => {
    console.log(user._links.roles.href)
    console.log(user.roles)
    $http
      .put(user._links.roles.href, user.roles)
      .then((resp) => {
        console.log(resp)
        Swal.fire('Updated!', 'User roles have been updated.', 'success')
      })
      .catch((err) =>
        Swal.fire(
          'Failed to update!',
          'An error has occur. Please try again!',
          'error'
        )
      )
  }

  $scope.updateRole = (user, role) => {
    if (containsRole(user, role)) {
      user.roles.splice(roleIndex(user, role), 1)
    } else user.roles.push(role)
    // $http({
    //   method: 'PATCH',
    //   url: user._links.roles,
    //   data: user.roles,
    // })
    // $http
    //   .patch(user._links.roles, user.roles)
    //   .then((resp) => console.log(resp))
    //   .catch((err) => console.log(err.keys))
  }
})

function containsRole(user, role) {
  return roleIndex(user, role) > -1
}

function roleIndex(user, role) {
  return user.roles.findIndex((item) => item.name === role.name)
}
